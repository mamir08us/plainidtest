from datetime import date
import mysql.connector
from mysql.connector import errorcode
import logging


LOG_FORMAT = '%(asctime)-15s %(levelname)s %(message)s'
LOG_FILE = '/home/okey/Desktop/sublime/log.txt'

logger= logging.getLogger()
logger.setLevel(logging.DEBUG) 
handler = logging.FileHandler(LOG_FILE, 'a', 'utf-8')
handler.setFormatter(logging.Formatter(LOG_FORMAT))
logger.addHandler(handler)

query_config = {
  'user': 'root',
  'password': 'Test@123',
  'host': '127.0.0.1',
  'raise_on_warnings': True
}
DB_NAME = 'atm'

TABLES = {}

TABLES['customer'] = (
    "CREATE TABLE `customer` ("
    "  `account_number` int(11) NOT NULL AUTO_INCREMENT,"
    "  `fullname` varchar(50) NOT NULL,"
    "  `username` varchar(16) NOT NULL,"
    "  `password` varchar(16) NOT NULL,"
    "  `gender` enum('M','F') NOT NULL,"
    "  `email` varchar(50) NOT NULL,"
    "  `date_of_birth` date NOT NULL,"
    "  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
    "  PRIMARY KEY (`account_number`)"
    ") ENGINE=InnoDB")

TABLES['account'] = (
    "CREATE TABLE `account` ("
    "  `customer_id` int(11) NOT NULL,"
    "  `balance` char(10) NOT NULL,"
    "  `account_type` enum('Current','Savings') NOT NULL,"
    "  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
    "  PRIMARY KEY (`customer_id`)"
    ") ENGINE=InnoDB")

# Only run once
cnx = mysql.connector.connect(**query_config)
cursor = cnx.cursor()
def create_database(cursor):
	try:
		cursor.execute("CREATE DATABASE {} DEFAULT CHARACTER SET 'UTF8MB4'".format(DB_NAME))
		logger.info("database {} created successfully".format(DB_NAME))
	except mysql.connector.Error as err:
		logger.error("Failed creating database: {}".format(err))
		exit(1)

	try:
	    cursor.execute("USE {}".format(DB_NAME))
	    logger.info("using database {}".format(DB_NAME))
	except mysql.connector.Error as err:
	    logger.error("Database {} does not exists.".format(DB_NAME))
	    if err.errno == errorcode.ER_BAD_DB_ERROR:
	        create_database(cursor)
	        logger.info("Database {} created successfully.".format(DB_NAME))
	        cnx.database = DB_NAME
	    else:
	        logger.error(err)
	        exit(1)

	for table_name in TABLES:
	    table_description = TABLES[table_name]
	    try:
	        logger.info("Creating table {}: ".format(table_name))
	        cursor.execute(table_description)
	    except mysql.connector.Error as err:
	        if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
	            logger.info("already exists.")
	        else:
	            logger.error(err.msg)
	    else:
	        logger.info("OK")

	cursor.close()
	cnx.close()

create_database(cursor)