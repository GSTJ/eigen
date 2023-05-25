import { Button, Flex, Spacer, Text } from "@artsy/palette-mobile"
import { useBottomSheetModal } from "@gorhom/bottom-sheet"
import { captureMessage } from "@sentry/react-native"
import { ArtworkListsBottomSheetSectionTitle } from "app/Components/ArtworkLists/components/ArtworkListsBottomSheetSectionTitle"
import {
  AutoHeightBottomSheet,
  AutoHeightBottomSheetProps,
} from "app/Components/ArtworkLists/components/AutoHeightBottomSheet"
import { useArtworkListsBottomOffset } from "app/Components/ArtworkLists/useArtworkListsBottomOffset"
import { useArtworkListToast } from "app/Components/ArtworkLists/useArtworkListsToast"
import { HeaderMenuArtworkListEntity } from "app/Scenes/ArtworkList/types"
import { goBack } from "app/system/navigation/navigate"
import { FC } from "react"
import { useDeleteArtworkList } from "./useDeleteArtworkList"

const NAME = "deleteArtworkListView"

interface DeleteArtworkListViewProps extends Omit<AutoHeightBottomSheetProps, "children"> {
  artworkListEntity: HeaderMenuArtworkListEntity
  onDismiss: () => void
}

export const DeleteArtworkListView: FC<DeleteArtworkListViewProps> = ({
  artworkListEntity,
  ...rest
}) => {
  const bottomOffset = useArtworkListsBottomOffset(2)
  const toast = useArtworkListToast()
  const { dismiss } = useBottomSheetModal()
  const [commit, isArtworkListDeleting] = useDeleteArtworkList()

  const closeView = () => {
    dismiss(NAME)
  }

  const deleteArtworkList = () => {
    commit({
      variables: {
        input: {
          id: artworkListEntity.internalID,
        },
      },
      onCompleted: () => {
        toast.changesSaved()
        goBack()
      },
      onError: (error) => {
        if (__DEV__) {
          console.error(error)
        } else {
          captureMessage(error.stack!)
        }
      },
    })
  }

  return (
    <AutoHeightBottomSheet name={NAME} {...rest}>
      <Flex mt={1} mx={2} mb={`${bottomOffset}px`}>
        <ArtworkListsBottomSheetSectionTitle>
          Delete {artworkListEntity.title} list?
        </ArtworkListsBottomSheetSectionTitle>

        <Text textAlign="center" variant="sm" my={2}>
          You’ll lose any works that are only saved on this list.
        </Text>

        <Spacer y={2} />

        <Button block loading={isArtworkListDeleting} onPress={deleteArtworkList}>
          Yes, Delete List
        </Button>

        <Spacer y={1} />

        <Button block variant="outline" onPress={closeView}>
          Cancel
        </Button>
      </Flex>
    </AutoHeightBottomSheet>
  )
}
