from datetime import datetime
from .models import ToDo, User
from . import app, mail, scheduler
from flask_mail import Message

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def send_reminder(todo_id):
    with app.app_context():
        todo = ToDo.query.get(todo_id)
        user = User.query.get(todo.user_id)
        send_reminder_email(user.email, todo.title, todo.description, todo.priority, todo.due_date, user.username)
        logger.info(f"Sent reminder for todo '{todo.title}' to '{user.email}'")


def send_reminder_email(email, todo_title, todo_description, todo_priority, todo_due_date,  username):
    formatted_due_date = todo_due_date.strftime('%m-%d-%Y')
    html_content = f"""
    <html>
    <head>
        <style>
            .container {{
                font-family: Arial, sans-serif;
                margin: 20px;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background-color: #fdf1f1;
                max-width: 600px;
            }}
            .header {{
                background-color: #c8e471;
                color: white;
                padding: 10px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }}
            .content {{
                padding: 20px;
                color: #333;
            }}
            .footer {{
                margin-top: 20px;
                text-align: center;
                color: #777;
            }}
            .button {{
                display: inline-block;
                padding: 10px 20px;
                font-size: 16px;
                color: white;
                background-color: #c8e471;
                border-radius: 5px;
                text-decoration: none;
            }}
            .button:hover {{
                background-color: #a4c249;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Todo Reminder</h1>
            </div>
            <div class="content">
                <h1>{username},</h1>
                <h2>This is a reminder for your todo item:</h2>
                <h1><u>{todo_title}</u></h1>
                <h3>{todo_description}</h3>
                <h3>Due Date: {formatted_due_date}</h3>
                <h3>Priority: {todo_priority}</h3>
            </div>
    </body>
    </html>
    """

    msg = Message(
        'Todo Reminder',
        sender='your_email@example.com',
        recipients=[email],
        html=html_content
    )
    mail.send(msg)


def schedule_email(todo_id, reminder_time):
    reminder_datetime = datetime.combine(datetime.today(), reminder_time)
    scheduler.add_job(
        func=send_reminder,
        trigger='date',
        run_date=reminder_datetime,
        args=[todo_id],
        id=f'reminder_{todo_id}',
        replace_existing=True
    )
    logger.info(f"Scheduled reminder for todo {todo_id} at {reminder_datetime}")


@scheduler.task('cron', id='send_reminders', hour=0)
def daily_task():
    with app.app_context():
        today = datetime.today().date()
        todos = ToDo.query.filter_by(due_date=today, reminder=True).all()
        logger.info(f"Found {len(todos)} todos with reminders for today")
        for todo in todos:
            schedule_email(todo.id, todo.reminder_time)
