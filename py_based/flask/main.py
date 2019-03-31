#
# This is a Hello World example, giving an introduction to Flask
# 
#
# Main imports
#
# Import json class for type conversion
import json
import numpy as np
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

from algorithm import nn
# Import time for DBG
import time

# Import numberic lib
import numpy

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

@app.route('/init', methods=['GET'])
def init():

    # DBG
    print("[MAIN] Sending weight matrix as response")

    time.sleep(0.5)
    print("[MAIN] Waited 0.5s")
  
    use_nn = True

    if use_nn == False:
      # Prepare weight matrix
      # DBG (usage sample)
      # The weight matrix(s) is(are) in the format of [matrixcount, matrix1, matrix2, ..]
      matrix_count = 3
      # matrix 1 -> 2x5 matrix (2 rows x 5 cols)
      matrix1 = [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0]]
      # matrix 2 -> 5x5 matrix
      matrix2 = [[1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1]]
      # matrix 3 -> 5x1 matrix
      matrix3 = [[1], [2], [3], [4], [5]]
      matrix  = []
      matrix.append(matrix1)
      matrix.append(matrix2)
      matrix.append(matrix3)
      # DBG
      # print("[MAIN] MATRIX IS ", matrix)
    else:
      matrix = nn.getRandWeightMatrix(_hidden_layer_sizes=(10,10)) #can pass in hidden layer sizes to this as needed
      matrix_id = nn.MATRIX_ID
      nn.MATRIX_ID = nn.MATRIX_ID + 1
      matrix_count = len(matrix)
      # DBG
      #print("[MAIN] ", matrix_id)

    #TODO Store Matrix to a file with ID
    #np.savetxt('MATRIX_DATA.dat',matrix)

    # Send the weight matrices over, dynamic matrix count supported
    ack = {"status": 1, "matrix_count": matrix_count, "matrix": matrix['matrix_formatted'], "matrix_id": matrix_id}
    # Make response
    return make_response(json.dumps(ack), 200)

@app.route('/ret', methods=['POST'])
def ret():

    # Parse POST packet and get award score
    award_score = json.loads(request.get_data())

    print("[MAIN] Got award score", award_score)
    #TODO Add score to file corresponding to ID
    #data = np.load('/tmp/f1.npz')
    #np.savez('/tmp/f1.npz',matrix=data['matrix'],matrix_id=data['matrix_id'],award_score=award_score)
    #data = np.load('/tmp/f1.npz')
    #print("[MAIN] DATAFILE ID IS :", data['matrix_id'])
    #print("[MAIN] DATAFILE ID AWARD :", data['award_score'])
    #print("[MAIN] DATAFILE IS    :", data['matrix'])


    return make_response(json.dumps(""), 200)
