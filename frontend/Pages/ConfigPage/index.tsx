import { Button, Divider, Input, Layout, TopNavigation, useTheme } from '@ui-kitten/components'
import React, { useContext, useEffect, useState } from 'react'
import { Clipboard, ScrollView, StyleSheet } from 'react-native'
import { AppContext } from '../../Contexts/AppContext'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { useTranslation } from 'react-i18next'
import { dropTables } from '../../Functions/DatabaseFunctions'
import { RelayPoolContext } from '../../Contexts/RelayPoolContext'
import SInfo from 'react-native-sensitive-info'
import { getUser } from '../../Functions/DatabaseFunctions/Users'
import { EventKind } from '../../lib/nostr/Events'
import moment from 'moment'
import { showMessage } from 'react-native-flash-message'

export const ConfigPage: React.FC = () => {
  const theme = useTheme()
  const { goToPage, goBack, database, init } = useContext(AppContext)
  const { setPrivateKey, setPublicKey, relayPool, publicKey, privateKey } =
    useContext(RelayPoolContext)
  const [name, setName] = useState<string>()
  const [picture, setPicture] = useState<string>()
  const [about, setAbout] = useState<string>()
  const [lnurl, setLnurl] = useState<string>()
  const { t } = useTranslation('common')

  useEffect(() => {
    relayPool?.unsubscribeAll()
    if (database && publicKey) {
      getUser(publicKey, database).then((user) => {
        if (user) {
          setName(user.name)
          setPicture(user.picture)
          setAbout(user.about)
          setLnurl(user.lnurl)
        }
      })
    }
  }, [])

  const onPressBack: () => void = () => {
    relayPool?.unsubscribeAll()
    goBack()
  }

  const onPressLogout: () => void = () => {
    if (database) {
      relayPool?.unsubscribeAll()
      setPrivateKey(undefined)
      setPublicKey(undefined)
      dropTables(database).then(() => {
        SInfo.deleteItem('privateKey', {}).then(() => {
          SInfo.deleteItem('publicKey', {}).then(() => {
            init()
            goToPage('landing', true)
          })
        })
      })
    }
  }

  const onPushPublishProfile: () => void = () => {
    if (publicKey) {
      relayPool
        ?.sendEvent({
          content: JSON.stringify({
            name,
            about,
            picture,
            lud06: lnurl,
          }),
          created_at: moment().unix(),
          kind: EventKind.meta,
          pubkey: publicKey,
          tags: [],
        })
        .then(() => {
          showMessage({
            message: t('alerts.profilePublished'),
            duration: 4000,
            type: 'success',
          })
        })
    }
  }

  const renderBackAction = (): JSX.Element => (
    <Button
      accessoryRight={<Icon name='arrow-left' size={16} color={theme['text-basic-color']} />}
      onPress={onPressBack}
      appearance='ghost'
    />
  )

  const copyToClipboard: (value: string) => JSX.Element = (value) => {
    const copy: () => void = () => Clipboard.setString(value)

    return <Icon name={'copy'} size={16} color={theme['text-basic-color']} solid onPress={copy} />
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    actionContainer: {
      marginTop: 30,
      paddingLeft: 32,
      paddingRight: 32,
      paddingBottom: 32,
    },
    action: {
      backgroundColor: 'transparent',
      marginTop: 30,
    },
  })

  return (
    <>
      <Layout style={styles.container} level='2'>
        <TopNavigation
          alignment='center'
          title={t('configPage.title')}
          accessoryLeft={renderBackAction}
        />
        <ScrollView horizontal={false}>
          <Layout style={styles.actionContainer} level='2'>
            <Layout style={styles.action}>
              <Button
                onPress={() => goToPage('relays')}
                status='warning'
                accessoryLeft={
                  <Icon name='server' size={16} color={theme['text-basic-color']} solid />
                }
              >
                {t('configPage.relays')}
              </Button>
            </Layout>
            <Layout style={styles.action}>
              <Divider />
            </Layout>
            <Layout style={styles.action}>
              <Input
                placeholder={t('configPage.username')}
                value={name}
                onChangeText={setName}
                label={t('configPage.username')}
              />
            </Layout>
            <Layout style={styles.action}>
              <Input
                placeholder={t('configPage.picture')}
                value={picture}
                onChangeText={setPicture}
                label={t('configPage.picture')}
              />
            </Layout>
            <Layout style={styles.action}>
              <Input
                placeholder={t('configPage.lnurl')}
                value={lnurl}
                onChangeText={setLnurl}
                label={t('configPage.lnurl')}
              />
            </Layout>
            <Layout style={styles.action}>
              <Input
                placeholder={t('configPage.about')}
                multiline={true}
                textStyle={{ minHeight: 64 }}
                value={about}
                onChangeText={setAbout}
                label={t('configPage.about')}
              />
            </Layout>
            <Layout style={styles.action}>
              <Button
                onPress={onPushPublishProfile}
                status='success'
                accessoryLeft={
                  <Icon name='paper-plane' size={16} color={theme['text-basic-color']} solid />
                }
              >
                {t('configPage.publish')}
              </Button>
            </Layout>
            <Layout style={styles.action}>
              <Divider />
            </Layout>
            <Layout style={styles.action}>
              <Input
                disabled={true}
                placeholder={t('configPage.publicKey')}
                accessoryRight={() => copyToClipboard(publicKey ?? '')}
                value={publicKey}
                label={t('configPage.publicKey')}
              />
            </Layout>
            <Layout style={styles.action}>
              <Input
                disabled={true}
                placeholder={t('configPage.privateKey')}
                accessoryRight={() => copyToClipboard(privateKey ?? '')}
                value={privateKey}
                secureTextEntry={true}
                label={t('configPage.privateKey')}
              />
            </Layout>
            <Layout style={styles.action}>
              <Button onPress={onPressLogout} status='danger'>
                {t('configPage.logout')}
              </Button>
            </Layout>
          </Layout>
        </ScrollView>
      </Layout>
    </>
  )
}

export default ConfigPage
