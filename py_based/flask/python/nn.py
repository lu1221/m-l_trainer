from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
import random

NUM_FEATURES = 3
NUM_TRAIN_SETS = 100

#### X Inputs will be array of values (y-coordinate, velocity, acceleration) ###
#
# [y]            coordinates in base.js games ranges from 0 (ceiling) to 402 (ground)
# [velocity]     velocity ranges from -250 (max speed going up) to 250 (max fall speed possible)
# [acceleration] acceleration is BINARY, either GRAVITY=50 or ACCELERATION=200
#                TODO: Maybe set this to -1 for GRAVITY and 1 for ACCELERATION ?
# TODO: Consider extra features for expanding to horizontal movement of lander
################################################################################

# Setup a randomized neural network
def initRandNN():
  mlp = MLPClassifier(alpha=1e-5, hidden_layer_sizes=(5, 2), random_state=1)
  return mlp


# Create a randomized set of matrix X input feature array.
# TODO Consider using numpy matrices if it is compatible with sklearn
def generateRandFeatures():
  X = []
  for i in range(NUM_TRAIN_SETS):
    X.append([])
    for j in range(NUM_FEATURES):
        if(j == 0):
            X[i].append(random.randint(0,402));
        if(j == 1):
            X[i].append(random.randint(-250,250));
        if(j == 2):
            X[i].append(-50 if random.randint(0,1) == 0 else 200)
  return X

def generateRandOutputs():
   Y = []
   for i in range(NUM_TRAIN_SETS):
     Y.append(0 if random.randint(0,1) == 0 else 1)
   return Y

def printFeatures(X):
  for r in range(len(X)):
    print(X[r])

#################################################################################
# Just trying out functions here to see if they are working                     #
#################################################################################


mlp = initRandNN()
rand_X = generateRandFeatures()
rand_Y = generateRandOutputs()
print(mlp)
printFeatures(rand_X)
print(rand_Y)


##Standardize features by removing the mean and scaling to unit variance
##The standard score of a sample x is calculated as:
##  z = (x - u) / s
#scaler = StandardScaler()
#print(scaler.fit(rand_X))
#print(scaler.mean_)
#print(scaler.transform(rand_X))
mlp.fit(rand_X, rand_Y)

predict_X = generateRandFeatures()
print(mlp.predict(predict_X))
