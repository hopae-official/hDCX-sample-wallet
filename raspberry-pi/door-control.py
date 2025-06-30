from flask import Flask
import RPi.GPIO as GPIO
from time import sleep

GPIO.setmode(GPIO.BCM)

servo_pin = 12

GPIO.setup(servo_pin, GPIO.OUT)
servo = GPIO.PWM(servo_pin, 50)
servo.start(0)

servo_min_duty = 3
servo_max_duty = 12

def set_servo_degree(degree):
   if degree > 180:
      degree = 180
   elif degree < 0:
      degree = 0
   duty = servo_min_duty+(degree*(servo_max_duty-servo_min_duty)/180.0)
   servo.ChangeDutyCycle(duty)

app = Flask(__name__)

@app.route('/door/open', methods=['POST'])
def door_open():
   set_servo_degree(90)
   sleep(5)
   set_servo_degree(0)
   return {'result': 'success', 'message': 'Door opened'}

@app.route('/clean_up')
def clean_up():
   GPIO.cleanup()
   return {'result': 'success', 'message': 'Clean up done'}

if __name__ == "__main__":
   app.run(host="192.168.200.169", port = "8080")
