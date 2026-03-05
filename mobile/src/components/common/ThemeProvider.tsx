import React, { useCallback, useEffect } from 'react'
import { TamaguiProvider, Theme } from 'tamagui'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'

import config from '../../../tamagui.config'

// Keep the splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync()

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [fontsLoaded, fontError] = useFonts({
    // Inter variants
    Inter_400Regular: require('../../../assets/fonts/Inter-Regular.ttf'),
    Inter_500Medium: require('../../../assets/fonts/Inter-Medium.ttf'),
    Inter_600SemiBold: require('../../../assets/fonts/Inter-SemiBold.ttf'),
    Inter_700Bold: require('../../../assets/fonts/Inter-Bold.ttf'),
    // Noto Sans Arabic variants
    NotoSansArabic_400Regular: require('../../../assets/fonts/NotoSansArabic-Regular.ttf'),
    NotoSansArabic_500Medium: require('../../../assets/fonts/NotoSansArabic-Medium.ttf'),
    NotoSansArabic_600SemiBold: require('../../../assets/fonts/NotoSansArabic-SemiBold.ttf'),
    NotoSansArabic_700Bold: require('../../../assets/fonts/NotoSansArabic-Bold.ttf'),
  })

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  useEffect(() => {
    onLayoutReady()
  }, [onLayoutReady])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <Theme name="dark">
        {children}
      </Theme>
    </TamaguiProvider>
  )
}
