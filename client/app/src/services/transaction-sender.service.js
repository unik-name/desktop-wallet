;(function () {
  'use strict'

  angular.module('arkclient.services')
    .service('transactionSenderService', ['$timeout', 'gettextCatalog', 'gettext', 'dialogService', 'utilityService', 'accountService', 'storageService', 'toastService', 'neoApiService', 'transactionBuilderService', 'transactionValidatorService', '$http', TransactionSenderService])

  /**
   * TransactionSenderService
   * @constructor
   *
   * This service is used to send transactions; from displaying the dialog to
   * validating and executing them.
   *
   * TODO check the passphrase before moving to the next step
   */
  function TransactionSenderService ($timeout, gettextCatalog, gettext, dialogService, utilityService, accountService, storageService, toastService, neoApiService, transactionBuilderService, transactionValidator, $http) {
    /**
     * Show the send transaction dialog. Reuses the controller and its $scope
     * TODO because currently it depends on the original implementation of AccountController too
     */
    const openDialogIn = ($scope, accountCtrl, selectedAccount, uriScheme) => {
      $scope.maxTransactionsPerFile = 10

      const getTotalBalance = fee => {
        const balance = selectedAccount.balance
        return utilityService.arktoshiToArk(fee ? balance - fee : balance)
      }

      const parseTransactionsFile = (filePath, callback) => {
        const fs = require('fs')
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            toastService.error(gettextCatalog.getString('Unable to load file') + ': ' + err)
          } else {
            const parse = require('csv-parse')
            parse(data, { quote: null, to: $scope.maxTransactionsPerFile }, (err, transactionsData) => {
              if (err) {
                return toastService.error(gettext('Error while parsing the file'))
              }

              callback(transactionsData)
            })
          }
        })
      }

      const processTransactionsData = data => {
        return data.map(d => {
          return {
            address: d[0],
            amount: Number(utilityService.arkToArktoshi(parseFloat(d[1]), 0)),
            smartbridge: d[2]
          }
        })
      }

      const prepareTransaction = (selectedAccount, data) => {
        return transactionBuilderService.createSendTransaction(data)
          .then(
            transaction => accountCtrl.showValidateTransaction(selectedAccount, transaction),
            accountCtrl.formatAndToastError
          )
      }

      const prepareMultipleTransactions = (selectedAccount, data) => {
        return transactionBuilderService.createMultipleSendTransactions(data)
          .then(transactions => transactionValidator.openDialogIn($scope, selectedAccount, transactions))
          .catch(accountCtrl.formatAndToastError)
      }

      $scope.ac = accountCtrl
      $scope.network = accountCtrl.network

      $scope.submit = tab => {
        if (!$scope[`${tab}Form`].$valid) {
          return
        }

        const data = {
          ledger: selectedAccount.ledger,
          publicKey: selectedAccount.publicKey,
          masterpassphrase: $scope.data.passphrase.trim(),
          fromAddress: $scope.data.fromAddress,
          fromUnikname: $scope.data.fromUnikName
        }

        if ($scope.data.secondPassphrase) {
          data.secondpassphrase = $scope.data.secondPassphrase.trim()
        }

        dialogService.hide()

        if (tab === 'single') {
          data.toAddress = $scope.data.resolvedUnikname.resolver.address.trim()
          data.toUnikname = $scope.data.resolvedUnikname;
          data.amount = Number(utilityService.arkToArktoshi(parseFloat($scope.data.amount), 0))
          data.smartbridge = $scope.data.smartbridge

          prepareTransaction(selectedAccount, data)
        } else if (tab === 'multiple') {
          parseTransactionsFile($scope.data.file, transactionsData => {
            data.transactions = processTransactionsData(transactionsData)

            prepareMultipleTransactions(selectedAccount, data)
          })
        } else {
          throw new Error(`Unknown tab "${tab}"`)
        }
      }

      $scope.tab = 'single'
      $scope.data = {
        ledger: selectedAccount.ledger,
        fromAddress: selectedAccount ? selectedAccount.address : '',
        fromLabel: selectedAccount ? selectedAccount.username : null,
        secondSignature: selectedAccount ? selectedAccount.secondSignature : '',
        passphrase: '',
        secondPassphrase: '',
        unikname:'',
        resolvedAddress:''
      }
      $scope.totalBalance = getTotalBalance(0)
      $scope.remainingBalance = getTotalBalance(0) // <-- initial value, this will change by directive

      if (uriScheme) {
        $timeout(() => {
          $scope.data.selectedAddress = {address: uriScheme.address}
          $scope.data.amount = uriScheme.amount
          $scope.data.smartbridge = uriScheme.vendorField
        }, 0)
      }

      $scope.cancel = () => dialogService.hide()

      $scope.selectFile = () => {
        require('electron').remote.dialog.showOpenDialog(fileNames => {
          if (fileNames === undefined) return

          $scope.data.file = fileNames[0]
        })
      }

      $scope.selectTab = tab => {
        $scope.tab = tab
      }

      $scope.fillSendableBalance = () => {
        function setBalance (fee) {
          const sendableBalance = getTotalBalance(fee)
          $scope.data.amount = sendableBalance > 0 ? sendableBalance : 0
        }
        // Set the balance with the default fees while updating it with the real fees
        setBalance(accountService.defaultFees.send)
        accountService.getFees(true).then(fees => {
          if (fees.send !== accountService.defaultFees.send) {
            setBalance(fees.send)
          }
        })
      }

      $scope.onQrCodeForToAddressScanned = address => {
        // This triggers the `selectedContactChange` function, which sets the `toAddress`
        $scope.data.selectedAddress = { address }
      }

      /* Auto-complete */

      let receiverValidationCycle = 0
      function validateReceiverAddress (input, exactMatch) {
        // failType specifies the "fail level", but is at the same time, also the icon name
        $scope.receiverValidation = {failType: null, message: null}
        $scope.receiverValidation.resolvedAccount = null

        if (!input) {
          return
        }

        const contacts = $scope.searchContactOrAccount(input, exactMatch)

        if (!accountService.isValidAddress(input)) {
          if (!exactMatch && contacts.length) { // don't show an error if the input is a potential contact
            return
          } else if (exactMatch && contacts.length === 1) { // return the contact if we got an exact match
            return contacts[0]
          } else if (exactMatch && contacts.length > 1) {
            $scope.receiverValidation.message = gettextCatalog.getString('Ambiguous input! Your name matches multiple contacts or wallets!')
            $scope.receiverValidation.failType = 'error'
            return
          }

          $scope.receiverValidation.message = gettextCatalog.getString('The address is not valid!')
          $scope.receiverValidation.failType = 'error'
          return
        }

        // if we are here, it means we have a real address and not a contact name anymore
        // we set the resolved account so we can display an appropriate icon, so the users knows what type of address this is
        if (contacts.length === 1) {
          $scope.receiverValidation.resolvedAccount = contacts[0]
        }

        if (selectedAccount && selectedAccount.address === input) {
          $scope.receiverValidation.message = gettextCatalog.getString('This address is your own address. Are you sure you want to send to your own address?')
          $scope.receiverValidation.failType = 'warning'
          return
        }

        const currentCycle = ++receiverValidationCycle

        accountService.getTransactions(input, 0, 1).then(txs => {
          // if this check is not true it means that the address has already been changed in the meantime and we can
          // ignore the result, also if a failType is already set, we return, because we don't want to overwrite a warning or error
          if (currentCycle !== receiverValidationCycle || txs.length || $scope.receiverValidation.failType) {
            return
          }

          $scope.receiverValidation.message = gettextCatalog.getString('It appears the address doesn\'t have any transactions. Are you sure it\'s correct?')
          $scope.receiverValidation.failType = 'info'
        })

        neoApiService.doesAddressExist(input).then(exists => {
          if (currentCycle !== receiverValidationCycle || !exists) {
            return
          }

          $scope.receiverValidation.message = gettextCatalog.getString('It looks like this is a \'NEO\' address. Are you sure it\'s correct?')
          $scope.receiverValidation.failType = 'warning'
        })
      }

      $scope.checkContacts = input => {
        if (input[0] !== '@') return true
      }

      $scope.searchTextChange = text => {
        $scope.data.toAddress = text
        validateReceiverAddress(text)
      }

      $scope.selectedContactChange = contact => {
        if (contact) {
          $scope.data.toAddress = contact.address
          validateReceiverAddress(contact.address)
        }
      }

      $scope.onAddressFieldBlur = () => {
        if (!$scope.data.toAddress) {
          return
        }

        // we check if the input is a valid address or a non-ambiguous contact name
        // if it's a contact name, we resolve it to an address
        const contact = validateReceiverAddress($scope.data.toAddress, true)
        if (contact && contact.address) {
          // setting the selectedAddress will trigger 'selectedContactChange'
          // which will then do a new validation again
          $scope.data.selectedAddress = contact
        }
      }

      $scope.searchContactOrAccount = (text, exactMatch) => {
        let contacts = accountCtrl.searchContactOrAccount(text, exactMatch)
        if (!contacts.length && !exactMatch) {
          // in case we didn't get a result we check if the inputed text is in the format "<name> - <address>"
          // if that's the case we split the input and if it's a valid address we search again
          // we do this because resolved / clicked contacts are in this format in the textbox
          const nameAndAddress = (text || '').split('-').map(t => t.trim())
          const address = nameAndAddress[nameAndAddress.length - 1]
          if (accountService.isValidAddress(address)) {
            contacts = accountCtrl.searchContactOrAccount(address, true)
          }
        }
        return contacts
      }

      $scope.resolveAddress = async () => {
        let unikname = $scope.data.unikname;
        try {
          if (unikname.indexOf('@') === 0) {

            let resolvedUnikname = await resolveUnikname(unikname);
            $scope.data.resolvedUnikname = resolvedUnikname.data;
          } else {
            $scope.data.resolvedUnikname = {
              resolver: {
                address: unikname
              }
            }
            let accountName = accountCtrl.accounts.filter(elm => {
              return elm.address === $scope.data.fromAddress;
            })[0].username;

            if (accountName && accountName.indexOf('@') === 0) {
              $scope.data.fromUnikName = accountName.split("#")[0];
            } else {
              $scope.data.fromUnikName = undefined;
            }
          }
        } catch(e) {
          if (e.status) {
            switch(e.status) {
              case 401:
              case 403:
              case 404:
                $scope.data.resolvedUnikname = {error: e.data};
                break;
              default:
                console.error(e)
                $scope.data.resolvedUnikname = undefined;
                throw(e);
            }
          } else {
            console.error(e);
            $scope.data.resolvedUnikname = undefined
          }
        }
      }

      function resolveUnikname(unikname){

        let headers = {
          Pragma: undefined,
          'Cache-Control': undefined,
          'X-Requested-With': undefined,
          'If-Modified-Since': undefined,
          'x-pm-appversion': undefined,
          'x-pm-uid': undefined,
          'x-pm-apiversion': undefined
        };

        let unikNameFrom = storageService.get('from-unik-name');

        if (unikNameFrom) {
          headers['Authorization'] = `Basic ${unikNameFrom}`;
        } else {
          $scope.data.fromUnikName = undefined;
        }

        let uniknameAndLabel = unikname.replace('@', '').split('#');
        return $http({
          method:'GET',
          url: `http://localhost:3000/uniknames/${uniknameAndLabel[0]}/labels/${uniknameAndLabel[1] ? uniknameAndLabel[1] : 'default'}/types/ARK`,
          headers: headers
        });
      }

      dialogService.open({
        scope: $scope,
        templateUrl: './src/components/account/templates/send-transaction-dialog.html'
      })
    }


    return {
      openDialogIn
    }
  }
})()