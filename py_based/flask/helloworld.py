#
# This is a Hello World example, giving an introduction to Flask
# 
#
# Main imports
#
# Import flask class 'Flask'
from flask import Flask
# Import render class for rendering data to the frontend
from flask import render_template
# Import request class to handle ajax
from flask import request
# Import make_response class to handle response
from flask import make_response
# Instantiate 'Flask' class with name 'helloworld' or '[hierarchy]/helloworld'
# depending on whether we are invoking with -m
app = Flask(__name__, template_folder='./html');

# Associate a rule with our connection
# Here we are tagetting all incoming requests and simply respond with
# 'Hello World!' message
# basically tell us which URTL should trigger the function that follows it
#
# TBD: why are we calling with @app. ???
@app.route('/')
# triggering function
def hello_world():
	return 'Hello, World'

# Replay with our html once we got a request targeting 127.0.0.1:5000/index
@app.route('/index')
# Callback function definition
def index():
  return render_template('index.html');

# Capture the event of moonlanding crash and etc
@app.route('/', methods=['POST'])
def test_post():
    status = request.form.get('status')
    if status == 'success':
      print("Hello World!")
      
      # Establish a response to phaser js upon crash info receival
      response = make_response()
      # Intialize response status
      response.status_code = 200
      # Force the response text type
      response.headers["content-type"] = "json"
      # Fill in response body
      response.data = { 'status':'success'
                  }
      return response

