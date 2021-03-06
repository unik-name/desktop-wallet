<template>
  <div class="ProfileEdition relative bg-theme-feature rounded-lg">
    <main class="flex flex-col sm:flex-row h-full">
      <div
        :style="`background-image: url('${assets_loadImage(backgroundImage)}')`"
        class="ProfileEdition__instructions sm:flex-grow background-image sm:w-1/2 lg:w-3/5"
      >
        <div class="instructions-text my-8 sm:mt-16 sm:mb-0 mx-8 sm:mx-16 w-auto md:w-1/2">
          <h3 class="mb-2 text-theme-page-instructions-text">
            {{ $t(`PAGES.PROFILE_EDITION.TAB_${tab.toUpperCase()}.INSTRUCTIONS.HEADER`) }}
          </h3>

          <p>
            {{ $t(`PAGES.PROFILE_EDITION.TAB_${tab.toUpperCase()}.INSTRUCTIONS.TEXT`) }}
          </p>
        </div>
      </div>

      <div class="sm:w-1/2 md:w-2/5">
        <MenuTab :tab="tab">
          <MenuTabItem
            :label="$t('PAGES.PROFILE_EDITION.TAB_PROFILE.TITLE')"
            tab="profile"
            class="p-5"
          >
            <ListDivided>
              <ListDividedItem
                :label="$t('COMMON.PROFILE_NAME')"
                class="ProfileEdition__name"
              >
                <InputText
                  v-if="isNameEditable"
                  v-model="$v.modified.name.$model"
                  label=""
                  :is-invalid="$v.modified.name.$dirty && $v.modified.name.$invalid"
                  :helper-text="nameError"
                  class="bg-transparent text-theme-page-text flex-1"
                  name="name"
                  @input="setName"
                  @keyup.enter.native="toggleIsNameEditable"
                  @keyup.esc.native="toggleIsNameEditable"
                />
                <div
                  v-else
                  :class="{
                    'ProfileEdition__field--modified': modified.name && modified.name !== profile.name
                  }"
                  class="leading-tight border-b border-transparent flex-1"
                >
                  {{ name }}
                </div>

                <button
                  :disabled="$v.modified.name.$dirty && $v.modified.name.$invalid"
                  class="ProfileEdition__name__toggle ml-2 cursor-pointer text-grey hover:text-blue inline-flex"
                  @click="toggleIsNameEditable"
                >
                  <SvgIcon
                    name="edit"
                    view-box="0 0 11 14"
                  />
                </button>
              </ListDividedItem>

              <ListDividedItem
                :label="$t('COMMON.PROFILE_UNIKNAME')"
                class="ProfileEdition__name"
              >
                <InputText
                  v-if="isNameEditable"
                  v-model="$v.modified.unikname.$model"
                  label=""
                  :is-invalid="$v.modified.unikname.$dirty && $v.modified.unikname.$invalid"
                  :helper-text="nameError"
                  class="bg-transparent text-theme-page-text flex-1"
                  name="unikname"
                  @input="setUnikname"
                  @keyup.enter.native="toggleIsNameEditable"
                  @keyup.esc.native="toggleIsNameEditable"
                />
                <div
                  v-else
                  :class="{
                    'ProfileEdition__field--modified': modified.unikname && modified.unikname !== profile.unikname
                  }"
                  class="leading-tight border-b border-transparent flex-1"
                >
                  {{ unikname }}
                </div>

                <button
                  :disabled="$v.modified.unikname.$dirty && $v.modified.unikname.$invalid"
                  class="ProfileEdition__name__toggle ml-2 cursor-pointer text-grey hover:text-blue inline-flex"
                  @click="toggleIsNameEditable"
                >
                  <SvgIcon
                    name="edit"
                    view-box="0 0 11 14"
                  />
                </button>
              </ListDividedItem>

              <ListDividedItem :label="$t('COMMON.LANGUAGE')">
                <MenuDropdown
                  :class="{
                    'ProfileEdition__field--modified': modified.language && modified.language !== profile.language
                  }"
                  :items="languages"
                  :value="language"
                  :position="['-50%', '0%']"
                  @select="selectLanguage"
                />
              </ListDividedItem>

              <ListDividedItem :label="$t('COMMON.BIP39_LANGUAGE')">
                <MenuDropdown
                  :class="{
                    'ProfileEdition__field--modified': modified.bip39Language && modified.bip39Language !== profile.bip39Language
                  }"
                  :items="bip39Languages"
                  :value="bip39Language"
                  :position="['-50%', '0%']"
                  @select="selectBip39Language"
                />
              </ListDividedItem>

              <ListDividedItem :label="$t('COMMON.CURRENCY')">
                <MenuDropdown
                  :class="{
                    'ProfileEdition__field--modified': modified.currency && modified.currency !== profile.currency
                  }"
                  :items="currencies"
                  :value="currency"
                  :position="['-50%', '0%']"
                  @select="selectCurrency"
                />
              </ListDividedItem>

              <ListDividedItem
                v-if="!hasWallets"
                :label="$t('COMMON.NETWORK')"
              >
                <MenuDropdown
                  :class="{
                    'ProfileEdition__field--modified': modified.networkId && modified.networkId !== profile.networkId
                  }"
                  :items="networks"
                  :value="networkId"
                  :position="['-50%', '0%']"
                  @select="selectNetwork"
                />
              </ListDividedItem>

              <ListDividedItem
                :label="$t('COMMON.AVATAR')"
                class="ProfileEdition__avatar"
              >
                <SelectionAvatar
                  :enable-modal="true"
                  :max-visible-items="3"
                  :selected="avatar"
                  @select="selectAvatar"
                />
              </ListDividedItem>
            </listdivided>
          </MenuTabItem>

          <MenuTabItem
            :label="$t('PAGES.PROFILE_EDITION.TAB_DESIGN.TITLE')"
            tab="design"
            class="p-5"
          >
            <ListDivided>
              <ListDividedItem
                :label="$t('COMMON.SELECT_THEME')"
                class="ProfileEdition__theme"
              >
                <SelectionTheme
                  :max-visible-items="4"
                  :selected="theme"
                  @select="selectTheme"
                />
              </ListDividedItem>

              <ListDividedItem
                :label="$t('COMMON.SELECT_BACKGROUND')"
                class="ProfileEdition__background"
              >
                <SelectionBackground
                  :max-visible-items="5"
                  :selected="background"
                  @select="selectBackground"
                />
              </ListDividedItem>
            </ListDivided>
          </MenuTabItem>
        </MenuTab>

        <!-- TODO at the bottom ? -->
        <footer class="ProfileEdition__footer mt-3 p-10">
          <button
            :disabled="!isModified || isNameEditable"
            class="blue-button"
            @click="save"
          >
            {{ $t('COMMON.SAVE') }}
          </button>
        </footer>
      </div>
    </main>
  </div>
</template>

<script>
import { capitalize, isEmpty } from 'lodash'
import { BIP39, I18N } from '@config'
import { InputText } from '@/components/Input'
import { ListDivided, ListDividedItem } from '@/components/ListDivided'
import { MenuDropdown, MenuTab, MenuTabItem } from '@/components/Menu'
import { SelectionAvatar, SelectionBackground, SelectionTheme } from '@/components/Selection'
import SvgIcon from '@/components/SvgIcon'
import Profile from '@/models/profile'

/**
 * This component uses the data property `modified` to hold the changes done during
 * the edition and to highlight the fields that have been changed in blue.
 */
export default {
  name: 'ProfileEdition',

  components: {
    InputText,
    ListDivided,
    ListDividedItem,
    MenuTab,
    MenuTabItem,
    MenuDropdown,
    SelectionAvatar,
    SelectionBackground,
    SelectionTheme,
    SvgIcon
  },

  data: () => ({
    isNameEditable: false,
    modified: {
      name: '',
      unikname: '',
      language: '',
      bip39Language: '',
      currency: ''
    },
    tab: 'profile'
  }),

  computed: {
    currencies () {
      return this.$store.getters['market/currencies']
    },
    languages () {
      return I18N.enabledLocales.reduce((all, locale) => {
        all[locale] = this.$t(`LANGUAGES.${locale}`)
        return all
      }, {})
    },
    bip39Languages () {
      return BIP39.languages.reduce((all, language) => {
        all[language] = this.$t(`BIP39_LANGUAGES.${language}`)

        return all
      }, {})
    },
    networks () {
      return this.$store.getters['network/all'].reduce((acc, network) => {
        acc[network.id] = network.name
        return acc
      }, {})
    },

    hasWallets () {
      const wallets = this.$store.getters['wallet/byProfileId'](this.profile.id)
      return !isEmpty(wallets)
    },

    isModified () {
      return Object.keys(this.modified).some(property => {
        if (this.modified[property]) {
          return this.modified[property] !== this.profile[property]
        }
        return false
      })
    },

    profile () {
      const profileId = this.$route.params.profileId
      return this.$store.getters['profile/byId'](profileId)
    },
    isCurrentProfile () {
      return this.session_profile.id === this.profile.id
    },

    avatar () {
      return this.modified.avatar || this.profile.avatar
    },
    background () {
      return this.modified.background || this.profile.background
    },
    // TODO update it when modified, but it's changed on the sidemenu
    currency () {
      return this.modified.currency || this.profile.currency
    },
    language () {
      return this.modified.language || this.profile.language
    },
    bip39Language () {
      return this.modified.bip39Language || this.profile.bip39Language || 'english'
    },
    name () {
      return this.modified.name || this.profile.name
    },
    unikname () {
      return this.modified.unikname || this.profile.unikname
    },
    networkId () {
      return this.modified.networkId || this.profile.networkId
    },
    // TODO update it when modified, but it's changed on the sidemenu
    theme () {
      return this.modified.theme || this.profile.theme
    },
    backgroundImage () {
      return `pages/profile-new/background-step-3${this.session_hasDarkTheme ? '-dark' : ''}.png`
    },
    nameError () {
      if (this.$v.modified.name.$dirty && this.$v.modified.name.$invalid) {
        if (!this.$v.modified.name.doesNotExists) {
          return this.$t('VALIDATION.NAME.DUPLICATED', [this.modified.name])
        } else if (!this.$v.modified.name.maxLength) {
          return this.$t('VALIDATION.NAME.MAX_LENGTH', [Profile.schema.properties.name.maxLength])
        } else if (!this.$v.modified.name.minLength) {
          return this.$tc('VALIDATION.NAME.MIN_LENGTH', Profile.schema.properties.name.minLength)
        }
      }

      return null
    },
    uniknameError () { // TODO unikname errors
      return null
    }
  },

  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.$synchronizer.focus()
      vm.$synchronizer.pause('market')
    })
  },

  beforeDestroy () {
    this.$store.dispatch('session/load')
  },

  mounted () {
    this.modified.name = this.profile.name
    this.modified.unikname = this.profile.unikname
    this.modified.language = this.profile.language
    this.modified.bip39Language = this.profile.bip39Language
    this.modified.currency = this.profile.currency
  },

  methods: {
    toggleIsNameEditable () {
      if (!this.nameError || !this.isNameEditable) {
        if (!this.isNameEditable && !this.modified.name) {
          this.$set(this.modified, 'name', this.profile.name)
        }
        this.isNameEditable = !this.isNameEditable
      }
    },

    async save () {
      await this.$store.dispatch('profile/update', {
        ...this.profile,
        ...this.modified
      })

      this.$router.push({ name: 'profiles' })
    },

    selectAvatar (avatar) {
      this.__updateSession('avatar', avatar)
    },

    async selectBackground (background) {
      this.__updateSession('background', background)
    },

    selectCurrency (currency) {
      this.__updateSession('currency', currency)
    },

    async selectLanguage (language) {
      this.__updateSession('language', language)
    },

    selectBip39Language (bip39Language) {
      this.__updateSession('bip39Language', bip39Language)
    },

    selectNetwork (network) {
      this.$set(this.modified, 'networkId', network)
    },

    async selectTheme (theme) {
      this.__updateSession('theme', theme)
    },

    setName (event) {
      this.__updateSession('name', this.modified.name)
      this.$v.modified.name.$touch()
    },

    setUnikname (event) {
      this.__updateSession('unikname', this.modified.unikname)
      this.$v.modified.unikname.$touch()
    },

    async __updateSession (propertyName, value) {
      this.$set(this.modified, propertyName, value)

      if (this.isCurrentProfile) {
        const action = `session/set${capitalize(propertyName)}`
        await this.$store.dispatch(action, value)
      }
    }
  },

  validations: {
    modified: {
      name: {
        doesNotExists (value) {
          const otherProfile = this.$store.getters['profile/doesExist'](value)
          return !otherProfile || otherProfile.id === this.profile.id
        },
        maxLength (value) {
          return value.length <= Profile.schema.properties.name.maxLength
        },
        minLength (value) {
          return value.length >= Profile.schema.properties.name.minLength
        }
      },
      unikname: { // TODO Validations
      }
    }
  }
}
</script>

<style scoped>
/* To display the images scaled to the size of the button */
.ProfileEdition__instructions {
  background-size: cover;
  background-position: center center;
}
</style>

<style lang="postcss">
.ProfileEdition .MenuTab .MenuTab__nav__item {
  @apply .px-10 .py-6
}

.ProfileEdition__name .ProfileEdition__field--modified,
.ProfileEdition__field--modified .MenuDropdownHandler {
  @apply .text-blue .font-bold
}

.ProfileEdition__name .ListDividedItem__label {
  @apply .flex-no-shrink
}
.ProfileEdition__name .ListDividedItem__value {
  @apply .flex w-full text-right
}
.ProfileEdition__name .ListDividedItem__value .InputText {
  @apply .w-full .ml-4
}
.ProfileEdition__name__toggle {
  height: 21px
}
.ProfileEdition__name .ListDividedItem__value .InputText .InputField__wrapper {
  height: 0
}

.ProfileEdition__avatar.ListDividedItem,
.ProfileEdition__background.ListDividedItem,
.ProfileEdition__theme.ListDividedItem {
  @apply .flex-col
}
.ProfileEdition__avatar .ListDividedItem__value,
.ProfileEdition__background .ListDividedItem__value,
.ProfileEdition__theme .ListDividedItem__value {
  @apply .pt-4
}
.ProfileEdition__avatar .InputGrid__container {
  grid-template-columns: repeat(4, 4rem) !important;
  grid-gap: 1rem !important
}
</style>
