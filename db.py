from datetime import date
import mysql.connector
from mysql.connector import errorcode
import logging
import getpass as p

LOG_FORMAT = '%(asctime)-15s %(levelname)s %(message)s'
LOG_FILE = '/home/okey/Desktop/sublime/log.txt' #Personalize

logger= logging.getLogger()
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler(LOG_FILE, 'a', 'utf-8')
handler.setFormatter(logging.Formatter(LOG_FORMAT))
logger.addHandler(handler)

query_config = {
  'user': 'root', #Personalize
  'password': 'Test@123', #Personalize
  'host': '127.0.0.1',
  'database': 'atm',
  'raise_on_warnings': True
}

insert_account_data_query = ("INSERT INTO atm.account (customer_id, balance, account_type) VALUES (%s, %s, %s)")
insert_cusomer_data_query = ("INSERT INTO atm.customer (fullname, username, password, gender, email, date_of_birth) VALUES (%s, %s, %s, %s, %s, %s)")

check_customer_username = ("SELECT username FROM atm.customer;")
check_account_data = ("SELECT account_number FROM atm.customer;")

display_customer_data_query = ("SELECT account_number, balance, fullname FROM atm.account join atm.customer on (atm.account.customer_id = atm.customer.account_number) where username = %s and password = %s")
get_account_query = ("SELECT account_number FROM atm.customer WHERE username = %s and password = %s")

account_name_query = ("SELECT fullname FROM atm.customer WHERE account_number = %s")

balance_query = ("SELECT balance FROM atm.account WHERE account_number = %s")
login_query = ("SELECT username, password FROM atm.customer WHERE username = %s and password = %s")

#transfer_from_query = query_add = ("UPDATE atm.account SET balance = balance - %s WHERE account_number = %s")
#transfer_to_query = query_add = ("UPDATE atm.account SET balance = balance + %s WHERE account_number = %s")

transfer_from_query = query_add = ("UPDATE atm.account join atm.customer on (atm.account.customer_id = atm.customer.account_number) SET balance = balance - %s WHERE account_number = %s")
transfer_to_query = query_add = ("UPDATE atm.account join atm.customer on (atm.account.customer_id = atm.customer.account_number) SET balance = balance + %s WHERE account_number = %s")

customer_info_query = ("SELECT account_number, balance, fullname, email FROM atm.account join atm.customer on (atm.account.customer_id = atm.customer.id) where username = %s and password = %s")
account_info_query = ("SELECT account_number, balance, fullname, email FROM atm.account join atm.customer on (atm.account.customer_id = atm.customer.id) where account_number = %s")

def query_db(query, *args):
	cnx = mysql.connector.connect(**query_config)
	cursor = cnx.cursor()
	logger.debug('Database auth successful for USER: {}'.format(query_config.get('user')))
	val = []
	for arg in args:
		val.append(arg)
	val = tuple(val)
	cursor.execute(query, val) # Must be a tuple
	logger.debug('Database Query successful for USER: {}'.format(query_config.get('user')))
	result = []
	for r in cursor:
		result.append(r)
	if not result:
		cnx.commit()
	cursor.close()
	cnx.close()
	return result

#query_db(balance_query,'5000')
#query_db(insert_account_data_query,'1000','500000', 'Savings')
#print(query_db(insert_account_data_query,'1001', '9800000', 'Savings'))
#print(query_db(check_account_data))
#print(query_db(insert_cusomer_data_query,'Tope Goodwill', 'belu', 'belu', 'M', 'okcnduka@aol.com', date(1960, 2, 12)))
#print(query_db(customer_info_query,'okey','okey'))
#print(query_db(display_customer_data_query,'okey','okey'))
#print(query_db(account_info_query,'8000')) # = ("SELECT account_number, balance, fullname, email FROM atm.account join atm.customer on (atm.account.customer_id = atm.customer.id) where account_number = %s")