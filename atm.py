import logging
import db
import getpass as p
import deposit as dep
import acct_creation as ac

def atmDev():
  print('X'*20, 'THIS IS WONDER BANK', 'X'*20)
  print('#',' '*57,'#')
  print('X'*61)
  print('1. Existing customer login.\n2. Create a new account.')
  try:
    step = int(input('Select an option to proceed: '))
  except:
    step = 0
  while True:
    if step not in [1,2]:
      print('Select between 1 and 2')
      try:
        step = int(input('Select an option to proceed: '))
      except:
        step = 0
        continue
    else:
      break
  if step == 1:
    print('Welcome to Login page!')
    usern = input('Enter username: ')
    passwd = p.getpass(prompt='Enter password: ')
    if ac.loginAuth(usern,passwd):
      print('Your login was successful')
      #account_number, balance = 
      ac.dashBoard(usern,passwd)
      #choice = int(input('Enter your choice:1,2,3,4: '))
      while True:
        try:
          print('Select options 1 to 4.')
          choice = int(input('Enter your choice:1,2,3,4: '))
        except:
          choice = 0

        if choice in [1,2,3,4]:
          if choice == 1:
            dep.cashDep(usern,passwd)
          elif choice == 2:
            dep.cashWdr(usern,passwd)
          elif choice == 3:
            dep.acctTrans(usern,passwd)
          elif choice == 4:
            print('Thanks for banking with us, we are here to serve you better.')
            break

        else:
          try:
            print('Select options 1 to 4.')
            choice = int(input('Enter your choice:1,2,3,4: '))
          except:
            choice = 0

  else:
    ac.createAccount()

atmDev()


