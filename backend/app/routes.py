from flask import Blueprint, request, jsonify
from . import app, db, bcrypt
from .models import User, ToDo
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime

account_bp = Blueprint('account', __name__)


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response


@app.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User already exists'}), 400
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(username=data['username'], email=data['email'], password=hashed_password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created successfully'}), 201


@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.get_json()
    user = User.query.filter(
        (User.username == data['username_or_email']) | (User.email == data['username_or_email'])).first()
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({'token': access_token}), 200
    return jsonify({'message': 'Invalid credentials'}), 401


@account_bp.route('/details', methods=['GET'])
@jwt_required()
def get_user_details():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify({
        'username': user.username,
        'email': user.email
    }), 200


@app.route('/todos', methods=['GET', 'POST', 'OPTIONS'])
@jwt_required()
def manage_todos():
    if request.method == 'OPTIONS':
        return '', 204
    user_id = get_jwt_identity()
    if request.method == 'POST':
        data = request.get_json()
        todo = ToDo(
            title=data['title'],
            description=data.get('description'),
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d') if data.get('due_date') else None,
            priority=data.get('priority', 'low'),
            user_id=user_id
        )
        db.session.add(todo)
        db.session.commit()
        return jsonify({
            'id': todo.id,
            'title': todo.title,
            'description': todo.description,
            'due_date': todo.due_date.strftime('%Y-%m-%d') if todo.due_date else None,
            'priority': todo.priority,
            'completed': todo.completed
        }), 201
    else:
        filter_by = request.args.get('filter', 'all')
        if filter_by == 'pending':
            todos = ToDo.query.filter_by(user_id=user_id, completed=False).all()
        elif filter_by == 'complete':
            todos = ToDo.query.filter_by(user_id=user_id, completed=True).all()
        else:
            todos = ToDo.query.filter_by(user_id=user_id).all()

        return jsonify([{
            'id': todo.id,
            'title': todo.title,
            'description': todo.description,
            'due_date': todo.due_date.strftime('%Y-%m-%d') if todo.due_date else None,
            'priority': todo.priority,
            'completed': todo.completed
        } for todo in todos]), 200


@app.route('/todos/<int:id>', methods=['PUT', 'DELETE', 'OPTIONS'])
@jwt_required()
def update_or_delete_todo(id):
    if request.method == 'OPTIONS':
        return '', 204
    user_id = get_jwt_identity()
    todo = ToDo.query.filter_by(id=id, user_id=user_id).first()
    if not todo:
        return jsonify({'message': 'ToDo not found'}), 404

    if request.method == 'PUT':
        data = request.get_json()
        if data is None:
            return jsonify({'message': 'Request body must be JSON'}), 400
        if 'title' in data:
            todo.title = data['title']
        if 'description' in data:
            todo.description = data.get('description', todo.description)
        if 'due_date' in data:
            todo.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d') if data.get('due_date') else todo.due_date
        if 'priority' in data:
            todo.priority = data.get('priority', todo.priority)
        if 'completed' in data:
            todo.completed = data.get('completed', todo.completed)
        db.session.commit()
        return jsonify({
            'id': todo.id,
            'title': todo.title,
            'description': todo.description,
            'due_date': todo.due_date.strftime('%Y-%m-%d') if todo.due_date else None,
            'priority': todo.priority,
            'completed': todo.completed
        }), 200
    else:
        db.session.delete(todo)
        db.session.commit()
        return jsonify({'message': 'ToDo deleted successfully'}), 200


@account_bp.route('/email', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_email():
    if request.method == 'OPTIONS':
        return '', 204
    user_id = get_jwt_identity()
    data = request.get_json()
    user = User.query.get(user_id)
    user.email = data['email']
    db.session.commit()
    return jsonify(user.to_dict())


@account_bp.route('/password', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_password():
    if request.method == 'OPTIONS':
        return '', 204
    user_id = get_jwt_identity()
    data = request.get_json()
    user = User.query.get(user_id)
    user.set_password(data['password'])
    db.session.commit()
    return jsonify(user.to_dict())


@account_bp.route('/delete', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_account():
    if request.method == 'OPTIONS':
        return '', 204
    user_id = get_jwt_identity()

    # Delete all todos associated with the user
    todos = ToDo.query.filter_by(user_id=user_id).all()
    for todo in todos:
        db.session.delete(todo)

    # Delete the user
    user = User.query.get(user_id)
    db.session.delete(user)
    db.session.commit()

    return '', 204


@account_bp.route('/reset', methods=['POST', 'OPTIONS'])
@jwt_required()
def reset_account():
    if request.method == 'OPTIONS':
        return '', 204
    user_id = get_jwt_identity()
    ToDo.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    user = User.query.get(user_id)
    return jsonify(user.to_dict())


app.register_blueprint(account_bp, url_prefix='/account')
