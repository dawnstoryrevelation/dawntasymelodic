from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['VPGWFivuHKlW63c2uXGOHoJQ5BFH0a5Wiadx9yRklfUWCi9bDiyA6Bt7aH7ybShn6xkfVUfMQOW44Te20mdW9HdNpntaOsmHqMsHs3Yo2ktE5fGt8gCN6sbeFYSgjgy9RBKM0OLk4B6c3QY3UiR6GzAZNGjpPmdMeZFHDOfhQP2zTFvD6mLSViCP6cTo7EYhUTEtEq1m'] = os.getenv('VPGWFivuHKlW63c2uXGOHoJQ5BFH0a5Wiadx9yRklfUWCi9bDiyA6Bt7aH7ybShn6xkfVUfMQOW44Te20mdW9HdNpntaOsmHqMsHs3Yo2ktE5fGt8gCN6sbeFYSgjgy9RBKM0OLk4B6c3QY3UiR6GzAZNGjpPmdMeZFHDOfhQP2zTFvD6mLSViCP6cTo7EYhUTEtEq1m')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        # Check if email is already registered
        if User.query.filter_by(email=email).first():
            flash("Email already registered. Please login.", "danger")
            return redirect(url_for('signup'))
        # Secure the password
        hashed_password = generate_password_hash(password, method='sha256')
        new_user = User(email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        flash("Account created successfully! Please log in.", "success")
        return redirect(url_for('login'))
    return render_template('signup.html')

@app.route('/login')
def login():
    return "Login page coming soon!"
@app.route('/welcome', methods=['POST', 'GET'])
def welcome():
    return render_template('/welcome.html')
if __name__ == '__main__':
    # Create tables right before running the app
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=3000, debug=True)


