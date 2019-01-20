#
# This is a Hello World example, giving an introduction to Flask
# 
#
# Main imports
#
# Import json class for type conversion
import json

# Import flask class 'Flask'
from flask import Flask
# Import render class for rendering data to the frontend
from flask import render_template
# Import request class to handle ajax
from flask import request
# Import make_response class to handle response
from flask import make_response
# Import timedelta class to constantly clear the cache
from datetime import timedelta
# Instantiate 'Flask' class with name 'helloworld' or '[hierarchy]/helloworld'
# depending on whether we are invoking with -m
app = Flask(__name__, template_folder='./html');

# Cache setting
app.config['DEBUG'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(seconds=1)

# Associate a rule with our connection
# Here we are tagetting all incoming requests and simply respond with
# 'Hello World!' message
# basically tell us which URTL should trigger the function that follows it
#
# TBD: why are we calling with @app. ???
# @app.route('/')
# triggering function
# def hello_world():
#   return 'Hello, World'

# Replay with our html once we got a request targeting 127.0.0.1:5000/index
@app.route('/Start')
# Callback function definition
def start():
  return render_template('index.html')

# Capture the event of moonlanding crash and etc
@app.route('/LandingTrigger', methods=['POST'])
def landing():
    
    # request.form.get only works with GET request
    # and for POST request we use either request.args OR request.values
    # Here we use jsonify raw data
    data = json.loads(request.get_data(as_text=True))

    # Getting status
    status = data['status']
    altitude = data['altitude']
    acceleration = data['acceleration']
    velocity = data['velocity']
    explode = data['explode']

    print("status :", status)
    print("altitude :", altitude)
    print("acceleration ::", acceleration)
    print("velocity :", velocity)
    print("explode :", explode)

    if status == 'success':
      print("Landing information accepted..")
      
      # Construct return message(s)
      retData = {
      
      }
      retStatus = 200

      # Establish a response to phaser js upon crash info receival
      response = make_response(json.dumps(retData), retStatus)
      # Force the response text type
      response.headers["content-type"] = "application/json; charset=UTF-8"
      # Fill in response body
      return response

    return "null"

# Handshake with phaser.js to initiate a new feature set,
# in other words we use this to trigger/initiate a new set of genetic evolution
@app.route('/EvolutionTrigger', methods=['POST'])
def evolve():
    
    # In fact we don't care about POSTing content
    # because we are targetting /EvolutionTrigger, we know we need to
    # return a new set of feature values to initiate a genetic evolution

    # The only thing we need to make sure is that the POST request got
    # captured successfully and this is done by parsing the hash key, 'status'
    # in the request
    data = json.loads(request.get_data(as_text=True))

    # Getting status
    status = data['status']

    if status == 'success':
      print("(Re)initialize genetic evolution algorithm..")
      
      # Construct return message(s)
      retData = {
            "status" : "TBD",
            "altitude" : "TBD",
            "acceleration" : "TBD",
            "velocity" : "TBD",
            "explode" : "TBD"
      }
      retStatus = 200

      # Establish a response to phaser js upon crash info receival
      response = make_response(json.dumps(retData), retStatus)
      # Force the response text type
      response.headers["content-type"] = "application/json; charset=UTF-8"
      # Fill in response body
      return response

    return "null"
