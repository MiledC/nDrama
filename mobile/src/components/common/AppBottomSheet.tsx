import React, { useCallback, useMemo, forwardRef } from "react";
import { StyleSheet, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetProps,
} from "@gorhom/bottom-sheet";

interface AppBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onClose?: () => void;
  enablePanDownToClose?: boolean;
}

export const AppBottomSheet = forwardRef<BottomSheet, AppBottomSheetProps>(
  function AppBottomSheet(
    { children, snapPoints: customSnapPoints, onClose, enablePanDownToClose = true },
    ref
  ) {
    const snapPoints = useMemo(
      () => customSnapPoints || ["50%", "80%"],
      [customSnapPoints]
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.6}
        />
      ),
      []
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        onClose={onClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        <BottomSheetView style={styles.content}>{children}</BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: "#1F1133",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  indicator: {
    backgroundColor: "#666666",
    width: 36,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
