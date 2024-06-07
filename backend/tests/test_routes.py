import unittest
from app import app, db
from app.models import User, ToDo
from config import TestConfig

class RoutesTestCase(unittest.TestCase):

    def setUp(self):
        app.config.from_object(TestConfig)
        self.app = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_register_and_login(self):
        response = self.app.post('/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password'
        })
        self.assertEqual(response.status_code, 201)

        response = self.app.post('/login', json={
            'email': 'test@example.com',
            'password': 'password'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.get_json())

    def test_create_and_get_todos(self):
        self.app.post('/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password'
        })
        response = self.app.post('/login', json={
            'email': 'test@example.com',
            'password': 'password'
        })
        token = response.get_json()['token']

        response = self.app.post('/todos', json={
            'title': 'Test ToDo',
            'description': 'This is a test to-do item',
            'due_date': '2024-06-15'
        }, headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(response.status_code, 201)
        todo_id = response.get_json()['id']

        response = self.app.get('/todos', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(response.status_code, 200)
        todos = response.get_json()
        self.assertEqual(len(todos), 1)
        self.assertEqual(todos[0]['title'], 'Test ToDo')

    def test_update_todo(self):
        self.app.post('/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password'
        })
        response = self.app.post('/login', json={
            'email': 'test@example.com',
            'password': 'password'
        })
        token = response.get_json()['token']

        response = self.app.post('/todos', json={
            'title': 'Test ToDo',
            'description': 'This is a test to-do item',
            'due_date': '2024-06-15'
        }, headers={'Authorization': f'Bearer {token}'})
        todo_id = response.get_json()['id']

        response = self.app.put(f'/todos/{todo_id}', json={
            'title': 'Updated ToDo',
            'description': 'This is an updated to-do item',
            'due_date': '2024-06-16',
            'completed': True
        }, headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('ToDo updated successfully', response.get_json()['message'])

    def test_delete_todo(self):
        self.app.post('/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password'
        })
        response = self.app.post('/login', json={
            'email': 'test@example.com',
            'password': 'password'
        })
        token = response.get_json()['token']

        response = self.app.post('/todos', json={
            'title': 'Test ToDo',
            'description': 'This is a test to-do item',
            'due_date': '2024-06-15'
        }, headers={'Authorization': f'Bearer {token}'})
        todo_id = response.get_json()['id']

        response = self.app.delete(f'/todos/{todo_id}', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('ToDo deleted successfully', response.get_json()['message'])

if __name__ == '__main__':
    unittest.main()
