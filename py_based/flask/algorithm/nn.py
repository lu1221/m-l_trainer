from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
import numpy as np
import random
from datetime import datetime
import re

random.seed(datetime.now())
NUM_FEATURES = 2
NUM_TRAIN_SETS = 10000
PRECISION = 4 #Number of decimal places for precision

MATRIX_ID = 0
MIN_DIST = 32.0
MAX_DIST = 402.0

MIN_VEL = 0.0
MAX_VEL = 200.0

CURRENT_GENERATION = 1
CURRENT_MATRIX = []
CURRENT_BIAS_MATRIX = []

MAX_POPULATION = 20
# This Global Array will have MAX_POPULATION number of elements
# Each Element is a tuple of [ weightmatrix set, reward score, bias values]
GLOBAL_POP_ARRAY = []

# Maximum award_score allowed, items above this award score will be filtered out for next generation
# TODO Maybe we should reduce this number after every generation
MAX_AWARD_THRESHOLD = 150000

#### X Inputs will be array of values (y-coordinate, velocity) ###################################
#
# [distance]            coordinates in hook.js games ranges from 0.0 (ceiling) to 402.0 (ground)
# [velocity]     velocity ranges from -250.0 (max speed going up) to 250.0 (max fall speed possible)
# TODO: Consider extra features for expanding to horizontal movement of lander
# [boost]        binary output 1=boost, 0=no action
##################################################################################################


# Create MAX_POPULATION number of new weight matrices based on previous generation 
# Clear and insert the new set of MAX_POPULATION data into the GLOBAL_POP_ARRAY
def createNewGeneration():

  #TODO Uncomment once other functions are completed
  #filterCurrentGeneration()
  #TODO
  crossCurrentGeneration()
  #TODO
  mutateCurrentGeneration()

  return

# Parse through the GLOBAL_POP_ARRAY and remove the weak performers of this generation
# based on the reward scores earned. 
def filterCurrentGeneration():
  index = 0
  kill_indices = []
  for i in GLOBAL_POP_ARRAY:
    if i['award_score'] > MAX_AWARD_THRESHOLD : 
      kill_indices.append(index)
    index += 1
  print("KILLINDICES:",kill_indices)
  for i in sorted(kill_indices, reverse=True):
    del GLOBAL_POP_ARRAY[i]
  return

# Use the best performers of current generation in GLOBAL_POP_ARRAY to regenerate MAX_POPULATION 
def crossCurrentGeneration():

  return

# Randomly do some mutations in current generation 
def mutateCurrentGeneration():
  
  return

# Get average reward score of current GLOBAL_POP_ARRAY
def getAverageRewardScore():
  sum_score = 0
  pop_size = 0
  for i in GLOBAL_POP_ARRAY:
    sum_score += i['award_score']
    pop_size += 1
  return sum_score/pop_size


# Initialize randomized weight matrices for the first generation
def getRandWeightMatrix(_hidden_layer_sizes=(5,5)):
  matrix = []
  mlp = initRandNN(_hidden_layer_sizes)
  rand_X = generateRandFeatures()
  #printFeatures(rand_X)
  rand_Y = generateRandOutputs()
  #print(rand_Y)
  mlp.fit(rand_X, rand_Y)
  #printNNInfo(mlp)
 
  weightMatrix = getWeightMatrix(mlp)

  #Add bias matrix
  biasMatrix = getBiasMatrix(mlp)
  weightMatrix['bias_formatted']=biasMatrix['bias_formatted']
  weightMatrix['np_bias']=biasMatrix['np_bias']

  #print("[WEIGHT MATRIX IS]:\n", weightMatrix['np_matrix'])
  #print("[BIAS MATRIX IS]:\n", biasMatrix['np_matrix'])
  
  
  #Testing MLP Here to check outputs
  num_test_samples = random.randint(100,150)
  rndm_dist = np.transpose([np.around(np.linspace(32,402,num_test_samples),decimals=PRECISION)])
  rndm_vel = np.transpose([np.around(np.linspace(0,200,num_test_samples),decimals=PRECISION)])
  test_samples = np.append(rndm_dist, rndm_vel, axis=1)
  #print(test_samples)
  print(mlp.predict(test_samples))
  #print (weightMatrix)
  return weightMatrix

# Setup a randomized neural network with 2 hidden layers of size 5,5
def initRandNN(_hidden_layer_sizes=(5,5)):
  mlp = MLPClassifier(alpha=1e-5, hidden_layer_sizes=_hidden_layer_sizes, random_state=1, activation='logistic')
  return mlp


# Create a randomized set of matrix X input feature array.
# TODO Consider using numpy matrices if it is compatible with sklearn
def generateRandFeatures():
  X = []
  for i in range(NUM_TRAIN_SETS):
    X.append([])
    for j in range(NUM_FEATURES):
        if(j == 0): #distance
            X[i].append(round(random.uniform(MIN_DIST,MAX_DIST),PRECISION));
        if(j == 1): #vel
            X[i].append(round(random.uniform(MIN_VEL,MAX_VEL),PRECISION));
  return X

#Generate randomized output
def generateRandOutputs():
   Y = []
   for i in range(NUM_TRAIN_SETS):
     Y.append(0 if random.randint(0,1) == 0 else 1)
   return Y

def printFeatures(X):
  for r in range(len(X)):
    print(X[r])

def printNNInfo(mlp):
  print("******************* MLP Info: *************************")
  for i in range(len(mlp.coefs_)):
      number_neurons_in_layer = mlp.coefs_[i].shape[1]
      for j in range(number_neurons_in_layer):
          weights = mlp.coefs_[i][:,j]
          print(i, j, weights, end=", ")
          print()
      print()
  
  print("Bias values for first hidden layer:")
  print(mlp.intercepts_[0])
  print("\nBias values for second hidden layer:")
  print(mlp.intercepts_[1])
  print("\nBias values for third hidden layer:")
  print(mlp.intercepts_[2])
  print("*******************************************************")

#return a matrix where each element is a weight matrix
def getWeightMatrix(mlp):
  matrix=[]
  np_matrix=[]
  for i in mlp.coefs_:
    #print("COEFS IS: ", (np.matrix(i)))
    np_matrix.append(np.matrix(i))
    matrix.append((np.matrix(i)).tolist())
  return { "matrix_formatted" : matrix, "np_matrix" : np_matrix}

#return a matrix where each element is a bias values matrix for each layer
def getBiasMatrix(mlp):
  intercepts=[]
  np_intercepts=[]
  for i in mlp.intercepts_:
    #print("BIAS MATRIX IS: ", (np.matrix(i)))
    np_intercepts.append(np.matrix(i))
    intercepts.append((np.matrix(i)).tolist())
  return { "bias_formatted" : intercepts, "np_bias" : np_intercepts}
  


# Using a FITTED MLP
# Returns prediction matrix with 2 columns (dist, vel) for all values where output boost = 1
# For PRECISION value of 1:
#    4020 possible distance values
#    5000 possible velocity values
def getPredictionMatrix(mlp):
  num_rows = (((MAX_DIST-MIN_DIST)*(MAX_VEL-MIN_VEL))/(PRECISION*.1)**2)
  print("Number of rows for prediction matrix is ",int(num_rows))
  X1=np.array(np.arange(MIN_DIST,MAX_DIST,PRECISION*.1))
  X2=np.array(np.arange(MIN_VEL,MAX_VEL,PRECISION*.1))
  print(X1)
  print(X2)
  index = 0
  X = np.zeros((int(num_rows),2))
  print("X Array Shape:",X.shape)
  #print(np.linspace(MIN_DIST,MAX_DIST,(MAX_DIST-MIN_DIST)/(PRECISION*.1),endpoint=False))
  for i in np.arange(0,402,0.1):
    for j in np.arange(-250,250,0.1):
      #print(index, i, j)
      X[index] = np.array([i,j])
      index = index + 1
      if(index > num_rows-1):
        break
  #print(X)
  #print(mlp.predict(X))
  OutPut1 = np.array(mlp.predict(X))
  print("Number of samples where prediction=1:",np.sum(OutPut1))
  index_first1 = np.nonzero(OutPut1==1)[0][0]
  print("First index of prediction=1",index_first1, X[index_first1])
  index_predictions_1 = np.nonzero(OutPut1==1)
  print("Indices of prediction=1: ",index_predictions_1)
  #print("Prediction:",mlp.predict(np.array(X[index_first1]).reshape(1, -1)))

  PredictArray = np.zeros((np.sum(OutPut1),2))
  print("PredictArrayShape:",PredictArray.shape)
  index = 0
  for i in range(np.sum(OutPut1)):
    #print(i)
    #print(index_predictions_1[0][i])
    #print(X[index_predictions_1[0][i]])
    PredictArray[i]= X[index_predictions_1[0][i]]
  print(PredictArray)
  print(mlp.predict(PredictArray))
  return PredictArray

#Get Average of 2 MLP Weight Matrix sets
#Both NN Weight Matrices must be of same dimensions!
def getMeanNN(w1, w2):
  new_w = []
  for i in range(0,len(w1)):
    new_w.append(getMeanMatrix(w1[i],w2[i]))
  return new_w
     
    

#Get Average of 2 Matrices
def getMeanMatrix(mat1, mat2):
  return (np.array(mat1) + np.array(mat2))/2



#################################################################################
# Just trying out functions here to see if they are working                     #
#################################################################################

local_trial = False #True
if local_trial == True:
  weights1 = getRandWeightMatrix(_hidden_layer_sizes=(10,10))
  weights2 = getRandWeightMatrix(_hidden_layer_sizes=(10,10))
  
  w1 = weights1['np_matrix']
  w2 = weights2['np_matrix']
  
  
  #print(w1)
  #print(w2)
  #print(len(w1['np_matrix']))
  #for i in range(0,len(w1['np_matrix'])):
  #  print(i)
  #  print(w1['np_matrix'][i])
  
  w_new = getMeanNN(w1, w2)
  print (w_new)

#mlp = initRandNN(_hidden_layer_sizes=(5,5))
#rand_X = generateRandFeatures()
#rand_Y = generateRandOutputs()
#print(mlp)
##printFeatures(rand_X)
##print(rand_Y)
#
###Standardize features by removing the mean and scaling to unit variance
###The standard score of a sample x is calculated as:
###  z = (x - u) / s
##scaler = StandardScaler()
##print(scaler.fit(rand_X))
##print(scaler.mean_)
##print(scaler.transform(rand_X))
#mlp.fit(rand_X, rand_Y)
#
#print([coef.shape for coef in mlp.coefs_])
#print (mlp.coefs_)
#
#printNNInfo(mlp)
#
#weightMatrix = getWeightMatrix(mlp)
#matrix_count = len(weightMatrix)
#print(weightMatrix)
#print(len(weightMatrix))
#
#getRandWeightMatrix(_hidden_layer_sizes=(5,5))
#
##PredictionMatrix = getPredictionMatrix(mlp)
#
##predict_X = generateRandFeatures()
##print(mlp.predict(predict_X))
#
##arr = np.arange(0,11)
##print(arr)
