import { LegacyNativeModules } from "app/NativeModules/LegacyNativeModules"
import { GlobalStore, unsafe_getPushPromptSettings } from "app/store/GlobalStore"
import {
  PushAuthorizationStatus,
  getNotificationPermissionsStatus,
} from "app/utils/PushNotification"
import { postEventToProviders } from "app/utils/track/providers"
import { Alert, Linking, Platform } from "react-native"
import PushNotification from "react-native-push-notification"

const showSettingsAlert = () => {
  Alert.alert(
    "Artsy Would Like to Send You Notifications",
    "Turn on notifications to get important updates about artists you follow.",
    [
      { text: "Not Now", style: "cancel" },
      { text: "Settings", onPress: () => Linking.openSettings() },
    ]
  )
}

const showPrepromptAlert = async () => {
  Alert.alert(
    "Artsy Would Like to Send You Notifications",
    "Turn on notifications to get important updates about artists you follow.",
    [
      {
        text: "Not Now",
        style: "cancel",
        onPress: () => {
          postEventToProviders({
            action: "Artsy notification prompt response",
            action_type: "Tap",
            name: "Cancel",
            context_screen: "PushNotificationOnboarding",
          })
        },
      },
      {
        text: "OK",
        onPress: () => {
          postEventToProviders({
            action: "Artsy notification prompt response",
            action_type: "Tap",
            name: "Yes",
            context_screen: "PushNotificationOnboarding",
          })
          requestSystemPermissions()
        },
      },
    ]
  )

  await GlobalStore.actions.artsyPrefs.pushPromptLogic.setPushNotificationDialogLastSeenTimestamp(
    Date.now()
  )
}

const requestSystemPermissions = async () => {
  GlobalStore.actions.artsyPrefs.pushPromptLogic.setPushNotificationSystemDialogSeen(true)
  if (Platform.OS === "ios") {
    LegacyNativeModules.ARTemporaryAPIModule.requestDirectNotificationPermissions()
  } else {
    const permissions: Array<"alert" | "badge" | "sound"> = ["alert", "badge", "sound"]
    await PushNotification.requestPermissions(permissions)
  }
}

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7 // One week in milliseconds
const shouldDisplayPrepromptAlert = () => {
  const { pushNotificationDialogLastSeenTimestamp } = unsafe_getPushPromptSettings()!

  if (pushNotificationDialogLastSeenTimestamp) {
    // we don't want to ask too often
    // currently, we make sure at least a week has passed by since you last saw the dialog
    const pushNotificationDialogLastSeenDate = new Date(pushNotificationDialogLastSeenTimestamp)
    const currentDate = new Date()
    const timePassed = currentDate.getTime() - pushNotificationDialogLastSeenDate.getTime()
    return timePassed >= ONE_WEEK_MS
  } else {
    // if you've never seen one before, we'll show you ;)
    return true
  }
}

export const requestPushNotificationsPermission = async () => {
  const pushPromptSettings = unsafe_getPushPromptSettings()
  if (!pushPromptSettings) {
    return
  }

  const {
    pushPermissionsRequestedThisSession,
    pushNotificationSettingsPromptSeen,
    pushNotificationSystemDialogSeen,
  } = pushPromptSettings

  const { setPushPermissionsRequestedThisSession, setPushNotificationSettingsPromptSeen } =
    GlobalStore.actions.artsyPrefs.pushPromptLogic

  const permissionStatus = await getNotificationPermissionsStatus()
  if (permissionStatus === PushAuthorizationStatus.Authorized) {
    // On iOS, we need to request the push token again to trigger the onRegister callback
    if (Platform.OS === "ios") {
      LegacyNativeModules.ARTemporaryAPIModule.requestDirectNotificationPermissions()
    }
    return
  } else if (permissionStatus === PushAuthorizationStatus.Denied) {
    if (!pushNotificationSettingsPromptSeen) {
      showSettingsAlert()
      setPushNotificationSettingsPromptSeen(true)
    }
    return
  }

  if (pushPermissionsRequestedThisSession) {
    return
  }

  setTimeout(() => {
    if (!pushNotificationSystemDialogSeen && shouldDisplayPrepromptAlert()) {
      showPrepromptAlert()
      setPushPermissionsRequestedThisSession(true)
    }
    return
  }, 3000)
}
