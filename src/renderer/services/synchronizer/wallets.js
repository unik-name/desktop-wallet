import { difference, last, sortBy } from 'lodash'

class Action {
  constructor (synchronizer) {
    this.synchronizer = synchronizer

    this.checked = []
  }

  get $client () {
    return this.synchronizer.$client
  }

  get $dispatch () {
    return this.synchronizer.$store.dispatch
  }

  get $getters () {
    return this.synchronizer.$store.getters
  }

  get $logger () {
    return this.$scope.$logger
  }

  get $scope () {
    return this.synchronizer.scope
  }

  get $success () {
    return this.$scope.$success
  }

  get $t () {
    return this.$scope.$t.bind(this.$scope)
  }

  /**
   * TODO when adding a new wallet do not display the success toast with the last
   * transaction: is not necessary
   * TODO do not display 2 success toast when sending txs from 1 wallet to other
   */
  async run () {
    const profile = this.$scope.session_profile

    if (profile) {
      const allWallets = this.$getters['wallet/byProfileId'](profile.id)

      // Retrieve the data of wallets that have not been checked yet
      const notChecked = difference(allWallets, this.checked)

      // Only if all wallets have been checked previously
      // if (this.includesSameWallets(allWallets, notChecked)) {
      //   // To be sure that removed wallets are not used anymore
      //   this.checked = allWallets
      //
      //   if (walletsToCheck.length) {
      //     const since = this.findOldestCheckedAt(walletsToCheck)
      //
      //     const transactions = await this.fetchTransactionsSince(since)
      //     if (transactions) {
      //       transactions.forEach(transaction => {
      //         this.processTransaction(walletsToCheck, transaction)
      //       })
      //
      //     // As a fallback, retrieve all the wallets
      //     } else {
      //       await this.refreshWallets(walletsToCheck)
      //     }
      //   }
      // }

      // Check the not checked wallets now
      if (notChecked.length) {
        await this.refreshWallets(notChecked)
        this.checked = this.checked.concat(notChecked)
      }
    }
  }

  async refreshWallets (wallets) {
    await Promise.all(wallets.map(async wallet => {
      await this.refreshWallet(wallet)
    }))
  }

  async refreshWallet (wallet) {
    try {
      const walletData = await this.$client.fetchWallet(wallet.address)

      if (walletData) {
        const refreshedWallet = {
          ...wallet,
          ...walletData
        }
        this.$dispatch('wallet/update', refreshedWallet)

        await this.fetchWalletTransactions(refreshedWallet)
      } else {
        throw new Error('exam')
      }
    } catch (error) {
      this.$logger.error(error.message)
      // TODO the error could mean that the wallet isn't on the blockchain yet
      // this.$error(this.$t('COMMON.FAILED_FETCH', {
      //   name: 'wallet data',
      //   msg: error.message
      // }))
    }
  }

  /**
   * Fetches the transactions of the wallet. In case there are new transactions,
   * it displays the latest one
   */
  async fetchWalletTransactions (wallet) {
    try {
      const { transactions } = await this.$client.fetchWalletTransactions(wallet.address)

      if (transactions && transactions.length) {
        const latest = this.findLatestTransaction(transactions)
        const latestAt = latest.timestamp.getTime()

        if (latestAt > wallet.transactions.checkedAt) {
          this.$dispatch('wallet/update', {
            ...wallet,
            transactions: { checkedAt: latestAt }
          })

          this.displayNewTransaction(latest)
        }
      } else {
        throw new Error('exam')
      }
    } catch (error) {
      this.$logger.error(error)
    }
  }

  findLatestTransaction (transactions) {
    return last(sortBy(transactions, 'timestamp'))
  }

  displayNewTransaction (transaction) {
    this.$success(this.$t('SYNCHRONIZER.NEW_TRANSACION', { transactionId: transaction.id }))
  }
}

/*
 * This `Synchronizer` action keeps the wallets of the current profile in sync.
 * Instead of checking each wallet every interval, to be more efficient, since
 * some users have dozens of wallets, it loads their data initially and updates
 * them on each new block.
 *
 * @param {Synchronizer} synchronizer
 * @return {Promise}
 */
const action = async synchronizer => {
  const action = new Action(synchronizer)
  await action.run()
}

export {
  Action,
  action
}
export default action
