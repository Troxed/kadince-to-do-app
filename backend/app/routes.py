from flask import request, jsonify
from . import app, db, bcrypt
from .models import User, ToDo
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User already exists'}), 400
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(username=data['username'], email=data['email'], password=hashed_password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created successfully'}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter((User.username == data['username_or_email']) | (User.email == data['username_or_email'])).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({'token': access_token}), 200
    return jsonify({'message': 'Invalid credentials'}), 401


@app.route('/todos', methods=['GET', 'POST'])
@jwt_required()
def manage_todos():
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



@app.route('/todos/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def update_or_delete_todo(id):
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


