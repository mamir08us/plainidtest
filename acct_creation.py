
import db
from datetime import date
import mysql.connector
from mysql.connector import errorcode
import logging
import getpass as p
import re
import smtplib
from email.mime.text import MIMEText

#Create a new account and send en email after sucessful account creation with user's account name and number.
def createAccount():
	user_name = db.query_db(db.check_customer_username)
	#check_customer_username = ("SELECT username FROM atm.customer;")
	fullname = input('Enter your fullname: ').title()
	newuser = input('Enter a unique login username: ')
	while newuser in user_name:
		print('Not available! use another username')
		newuser = input('Enter a unique login username again: ')
	pd = p.getpass(prompt='Enter a login password:')
	gender = input('Gender! Enter either "M" or "F" only: ').upper()
	email = input('Enter a valid email address: ')
	while True:
		match = re.search(r'^(\w.+)@(\w+)\.(\w+)$', email)
		if not match:
			email = input('Re-enter a valid email address: ')
		else:
			break
	dob = input('Enter dte of birth in this format YYYY MM DD: ')
	dob = dob.split(' ')
	dob[0] = int(dob[0])
	dob[1] = int(dob[1])
	dob[2] = int(dob[2])
	db.query_db(db.insert_cusomer_data_query,fullname, newuser, pd, gender, email, date(dob[0],dob[1],dob[2]))
	balance = int(input('Enter your opening balance: '))
	account_type = input('Enter account type,"Savings" or "Current": ').title()
	account_number = db.query_db(db.get_account_query,newuser, pd)[0][0]
	db.query_db(db.insert_account_data_query, account_number, balance, account_type)
	db.logger.debug('Account successfully created for : {}'.format(fullname))
	print('Welcome to WONDER BANK'.center(60))
	server = smtplib.SMTP('smtp.gmail.com:587')
	server.starttls()
	server.ehlo()
	server.login('bankerspython@gmail.com', 'atmapplication2020')
	msg = MIMEText('Hello {}, Welcome to WONDER BANK! Your new account number is {}'.format(fullname, account_number))
	fromx = 'bankerspython@gmail.com'
	msg['Subject'] = 'Welcome to Wonder Bank'
	msg['From'] = fromx
	server.sendmail(fromx, email, msg.as_string()) 
	server.quit()

#createAccount()

#user account login.
def loginAuth(username,password):
  attemps = 3
  user_name, passwd = db.query_db(db.login_query,username,password)[0]
  while True:
    if username.lower() == user_name and password == passwd:
      db.logger.debug('Login successful for USER: {}'.format(user_name))
      print('Your login was successful')
      return True
    else:
      attemps = attemps - 1
      db.logger.debug('Failed login attempts')
      print('Wrong credential entered. You have {} login attempts left'.format(attemps))
      usern = input('Enter username again: ')
      paswd = p.getpass(prompt='Enter password again: ')
      if attemps <= 1:
        db.logger.debug('Account lockout for USER: {}'.format(user_name))
        print('Your account is locked out.')
        return False

#loginAuth('okey','okey')

def dashBoard(username,password):
    #print('X'*20, 'THIS IS WONDER BANK', 'X'*20)
    #print('#',' '*57,'#')
    #print('X'*61)
    #account_number, balance, fullname, _ = db.query_db(db.customer_info_query,'username','password')
    account_number, balance, fullname = db.query_db(db.display_customer_data_query,username,password)[0]
    print('WELCOME TO WONDER BANK'.center(60))
    print()
    print('Name:',fullname)
    print('Account number:',account_number,'\t\t Balance:',balance)
    print()
    print('..............'.center(60))
    print()
    print('BELOW ARE OPTION FOR YOUR SERVICE'.center(60))
    print()
    print('Cash deposit: \t',1,'\t\t\tTransfer:',3)
    print('Cash withdrawal:',2,'\t\t\tExit    :',4)
    print('#',' '*57,'#')
    print('X'*61)
    return (account_number, balance)
    