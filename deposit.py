import db
import dashBoard as dbod
import login


def cashDep(username,password):
	account_number, balance, __ = db.query_db(db.display_customer_data_query,username,password)[0]
	amt = int(input('Enter amount to deposit: '))
	final_amt = int(balance) + amt
	db.query_db(db.transfer_to_query,amt,account_number)
	db.logger.debug('Deposit successful for : {}'.format(account_number))
	print('Deposit of',amt,'Successful! Available balance is:',final_amt)
	return True

def cashWdr(username,password):
	account_number, balance, __ = db.query_db(db.display_customer_data_query,username,password)[0]
	amt = int(input('Enter amount to withdraw: '))
	if amt <= int(balance):
		final_amt = int(balance) - amt
		db.query_db(db.transfer_from_query,amt,account_number)
		db.logger.debug('Cash Withdrawal successful for : {}'.format(account_number))
		print('Withdrawal successful! available balance is:',final_amt)
		return True
	else:
		db.logger.debug('Cash Withdrawal unsuccessful for : {}'.format(account_number))
		print('Insufficient account balance.')
		return False

def acctTrans(username,password):
	account_number, balance, __ = db.query_db(db.display_customer_data_query,username,password)[0]
	ben_name = input('Enter beneficiary name: ')
	ben_acct = int(input('Enter beneficiary account number: '))
	accounts = db.query_db(db.check_account_data)
	for account in accounts:
		account = list(account)
		if ben_acct in account:
			print('You are transfering to',ben_name)
			trf_amt = int(input('Enter transfer amount: '))
			if trf_amt <= int(balance):
				final_amt = int(balance) - trf_amt
				db.query_db(db.transfer_from_query,trf_amt,account_number)
				db.query_db(db.transfer_to_query,trf_amt,ben_acct)
				db.logger.debug('Account number {} debited with {}'.format(account_number, trf_amt))
				db.logger.debug('Transfer successful. Account number {} credited with {}'.format(ben_acct, trf_amt))
				print('You have successfully transfered',trf_amt,'to',ben_name)
				return True
			else:
				db.logger.debug('Transfer failed for : {}'.format(account_number))
				print('Insufficient account balance.')
				return False
	else:
		db.logger.debug('Invalid account number entered')
		print('The account number entered does not exist! verify and try again')

#acctTrans('okey','okey')	
	#account_info_query = ("SELECT account_number, balance, fullname, email FROM atm.account join atm.customer on (atm.account.customer_id = atm.customer.id) where account_number = %s")
	#Send a mail notifying the recipient of the successful transfer