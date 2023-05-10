import { ActionType } from "@artsy/cohesion"
import { ClickedActivityPanelTab } from "@artsy/cohesion/dist/Schema/Events/ActivityPanel"
import { Screen } from "@artsy/palette-mobile"
import { ActivityQuery } from "__generated__/ActivityQuery.graphql"
import { TabsContainer } from "app/Components/Tabs/TabsContainer"
import { useMarkNotificationsAsSeen } from "app/Scenes/Activity/hooks/useMarkNotificationsAsSeen"
import { goBack } from "app/system/navigation/navigate"
import { Suspense } from "react"
import { OnTabChangeCallback, Tabs } from "react-native-collapsible-tab-view"
import { graphql, useLazyLoadQuery } from "react-relay"
import { useTracking } from "react-tracking"
import { ActivityList } from "./ActivityList"
import { ActivityTabPlaceholder } from "./ActivityTabPlaceholder"
import { NotificationType } from "./types"
import { getNotificationTypes } from "./utils/getNotificationTypes"

interface ActivityProps {
  type: NotificationType
}

export const ActivityContainer: React.FC<ActivityProps> = (props) => {
  return (
    <Suspense fallback={<ActivityTabPlaceholder />}>
      <ActivityContent {...props} />
    </Suspense>
  )
}

export const ActivityContent: React.FC<ActivityProps> = ({ type }) => {
  const types = getNotificationTypes(type)
  const queryData = useLazyLoadQuery<ActivityQuery>(
    ActivityScreenQuery,
    {
      count: 10,
      types,
    },
    {
      fetchPolicy: "store-and-network",
    }
  )

  useMarkNotificationsAsSeen()

  return <ActivityList viewer={queryData.viewer} me={queryData.me} type={type} />
}

export const Activity = () => {
  const tracking = useTracking()

  const handleTabPress: OnTabChangeCallback = (data) => {
    tracking.trackEvent(tracks.clickedActivityPanelTab(data.tabName))
  }

  return (
    <Screen>
      <Screen.Body fullwidth>
        <TabsContainer
          onTabChange={handleTabPress}
          renderHeader={() => {
            return (
              <Screen.Header
                title="Activity"
                titleProps={{ alignItems: "center" }}
                onBack={goBack}
              />
            )
          }}
        >
          <Tabs.Tab name="All" label="All">
            <ActivityContainer type="all" />
          </Tabs.Tab>
          <Tabs.Tab name="Alerts" label="Alerts">
            <ActivityContainer type="alerts" />
          </Tabs.Tab>
        </TabsContainer>
      </Screen.Body>
    </Screen>
  )
}

const ActivityScreenQuery = graphql`
  query ActivityQuery($count: Int, $after: String, $types: [NotificationTypesEnum]) {
    viewer {
      ...ActivityList_viewer @arguments(count: $count, after: $after, types: $types)
    }
    me {
      ...ActivityList_me
    }
  }
`

const tracks = {
  clickedActivityPanelTab: (tabName: string): ClickedActivityPanelTab => ({
    action: ActionType.clickedActivityPanelTab,
    tab_name: tabName,
  }),
}
