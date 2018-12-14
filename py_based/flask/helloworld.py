#
# This is a Hello World example, giving an introduction to Flask
#

#
# Main imports
#
# Import flask class 'Flask'
from flask import Flask
# Instantiate 'Flask' class with name 'helloworld' or '[hierarchy]/helloworld'
# depending on whether we are invoking with -m
app = Flask(__name__);

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

