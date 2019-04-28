#
# This is a Hello World example, giving an introduction to Flask
# 
#
# Main imports
#
# Import json class for type conversion
import json
import numpy as np
import copy
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
    if nn.MATRIX_ID > nn.MAX_POPULATION : 
      print("[MAIN] FINISHED CURRENT GENERATION!")
      nn.CURRENT_GENERATION += 1
      nn.MATRIX_ID = 0
      nn.createNewGeneration()

    if nn.CURRENT_GENERATION == 1 :
      matrix = nn.getRandWeightMatrix(_hidden_layer_sizes=(10,10)) #can pass in hidden layer sizes to this as needed
      nn.CURRENT_MATRIX = matrix['np_matrix'];
      nn.CURRENT_BIAS_MATRIX = matrix['np_bias'];
      matrix_id = nn.MATRIX_ID
      nn.MATRIX_ID = nn.MATRIX_ID + 1
      matrix_count = len(matrix['np_matrix'])
      # DBG
      print("[MAIN] ", matrix_id)
    else :
      matrix_id = nn.MATRIX_ID
      nn.MATRIX_ID = nn.MATRIX_ID + 1
      matrix = dict()
      matrix['matrix_formatted'] = []
      matrix['bias_formatted']=[]
      matrix_count = len(nn.GLOBAL_POP_ARRAY[nn.MATRIX_ID]['matrix'])
      for i in nn.GLOBAL_POP_ARRAY[nn.MATRIX_ID]['matrix']:
        matrix['matrix_formatted'].append((np.matrix(i)).tolist())
      for i in nn.GLOBAL_POP_ARRAY[nn.MATRIX_ID]['bias']:
        matrix['bias_formatted'].append((np.matrix(i)).tolist())


      
      

    #TODO Store Matrix to a file with ID
    #np.savetxt('MATRIX_DATA.dat',matrix)

    # Send the weight matrices over, dynamic matrix count supported
    ack = { "status": 1, 
            "matrix_count": matrix_count, 
            "matrix": matrix['matrix_formatted'], 
            "matrix_id": matrix_id,
            "bias": matrix['bias_formatted']}
    # Make response
    return make_response(json.dumps(ack), 200)

@app.route('/ret', methods=['POST'])
def ret():

    # Parse POST packet and get award score
    award_score = json.loads(request.get_data())

    print("[MAIN][",nn.MATRIX_ID,"] Got award score", award_score)
    nn.GLOBAL_POP_ARRAY.append( copy.deepcopy({"award_score": award_score, "matrix": nn.CURRENT_MATRIX, "bias":nn.CURRENT_BIAS_MATRIX}))

    print(nn.GLOBAL_POP_ARRAY[nn.MATRIX_ID-1])
    if nn.MATRIX_ID - 1 == 10:
        print("[MAIN] Current Generation[",nn.CURRENT_GENERATION,"] is Finished")
        print(nn.GLOBAL_POP_ARRAY)

    return make_response(json.dumps(""), 200)
