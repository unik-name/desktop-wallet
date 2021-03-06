import { I18N, MARKET } from '@config'
import i18n from '@/i18n'

export default {
  namespaced: true,

  state: () => ({
    avatar: null,
    background: null,
    currency: null,
    language: null,
    isMarketChartEnabled: true,
    name: null,
    unikname: null,
    profileId: null,
    theme: null,
    contentProtection: true,
    backgroundUpdateLedger: null,
    ledgerCache: null
  }),

  getters: {
    profileId (state) {
      return state.profileId
    },
    profile (state, _, __, rootGetters) {
      if (!state.profileId) {
        return
      }

      return rootGetters['profile/byId'](state.profileId)
    },
    network (state, getters, __, rootGetters) {
      if (!state.profileId) {
        return
      }

      const { networkId } = getters['profile']
      var network = rootGetters['network/byId'](networkId)

      if (!network) {
        network = rootGetters['network/customNetworkById'](networkId)
      }
      return network
    },
    avatar: state => state.avatar,
    background: state => state.background,
    currency: state => state.currency,
    isMarketChartEnabled: state => state.isMarketChartEnabled,
    theme: state => state.theme,
    language: state => state.language,
    bip39Language: state => state.bip39Language,
    name: state => state.name,
    unikname: state => state.unikname,
    hasDarkTheme: state => state.theme === 'dark',
    contentProtection: state => state.contentProtection,
    backgroundUpdateLedger: state => state.backgroundUpdateLedger,
    ledgerCache: state => state.ledgerCache
  },

  mutations: {
    SET_AVATAR (state, avatar) {
      state.avatar = avatar
    },

    SET_BACKGROUND (state, background) {
      state.background = background
    },

    SET_CURRENCY (state, currency) {
      state.currency = currency
    },

    SET_IS_MARKET_CHART_ENABLED (state, isEnabled) {
      state.isMarketChartEnabled = isEnabled
    },

    SET_LANGUAGE (state, language) {
      state.language = language
    },

    SET_BIP39_LANGUAGE (state, bip39Language) {
      state.bip39Language = bip39Language
    },

    SET_NAME (state, name) {
      state.name = name
    },

    SET_UNIKNAME (state, unikname) {
      state.unikname = unikname
    },

    SET_PROFILE_ID (state, profileId) {
      state.profileId = profileId
    },

    SET_THEME (state, theme) {
      state.theme = theme
    },

    SET_CONTENT_PROTECTION (state, protection) {
      state.contentProtection = protection
    },

    SET_BACKGROUND_UPDATE_LEDGER (state, update) {
      state.backgroundUpdateLedger = update
    },

    SET_LEDGER_CACHE (state, enabled) {
      state.ledgerCache = enabled
    },

    RESET (state) {
      state.avatar = 'pages/new-profile-avatar.svg'
      state.background = null
      state.currency = MARKET.defaultCurrency
      state.isMarketChartEnabled = true
      state.language = I18N.defaultLocale
      state.bip39Language = 'english'
      state.name = null
      state.unikname = null
      state.theme = 'light'
      state.backgroundUpdateLedger = true
      state.contentProtection = true
      state.ledgerCache = false
    }
  },

  actions: {
    load ({ rootGetters, dispatch }, profileId) {
      const profile = rootGetters['profile/byId'](profileId)
      if (!profile) return

      dispatch('setAvatar', profile.avatar)
      dispatch('setBackground', profile.background)
      dispatch('setCurrency', profile.currency)
      dispatch('setIsMarketChartEnabled', profile.isMarketChartEnabled)
      dispatch('setName', profile.name)
      dispatch('setUnikname', profile.unikname)
      dispatch('setLanguage', profile.language)
      dispatch('setBip39Language', profile.bip39Language)
      dispatch('setTheme', profile.theme)
      dispatch('setBackgroundUpdateLedger', profile.backgroundUpdateLedger)
      dispatch('setLedgerCache', profile.ledgerCache)

      return profile
    },

    reset ({ commit }) {
      commit('RESET')
    },

    setAvatar ({ commit }, value) {
      commit('SET_AVATAR', value)
    },

    setBackground ({ commit }, value) {
      commit('SET_BACKGROUND', value)
    },

    setCurrency ({ commit }, value) {
      commit('SET_CURRENCY', value)
    },

    setIsMarketChartEnabled ({ commit }, value) {
      commit('SET_IS_MARKET_CHART_ENABLED', value)
    },

    setLanguage ({ commit }, value) {
      commit('SET_LANGUAGE', value)
      i18n.locale = value
    },

    setBip39Language ({ commit }, value) {
      commit('SET_BIP39_LANGUAGE', value)
    },

    setName ({ commit }, value) {
      commit('SET_NAME', value)
    },

    setUnikname ({ commit }, value) {
      commit('SET_UNIKNAME', value)
    },

    setContentProtection ({ commit }, value) {
      commit('SET_CONTENT_PROTECTION', value)
    },

    setBackgroundUpdateLedger ({ commit }, value) {
      commit('SET_BACKGROUND_UPDATE_LEDGER', value)
    },

    setLedgerCache ({ commit }, value) {
      commit('SET_LEDGER_CACHE', value)
    },

    async setProfileId ({ commit, dispatch }, value) {
      commit('SET_PROFILE_ID', value)
      const profile = await dispatch('load', value)
      if (profile) {
        await dispatch('network/updateNetworkConfig', profile.networkId, { root: true })
      }
    },

    setTheme ({ commit }, value) {
      commit('SET_THEME', value)
    }
  }
}
