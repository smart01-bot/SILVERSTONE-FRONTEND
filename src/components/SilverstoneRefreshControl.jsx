/**
 * SilverstoneRefreshControl
 *
 * Drop-in for <RefreshControl> that uses Silverstone's brand red instead of
 * the platform-default grey blob.  Works with ScrollView and FlatList.
 *
 * Usage (ScrollView):
 *   <ScrollView
 *     refreshControl={
 *       <SilverstoneRefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
 *     }
 *   >
 *
 * Usage (FlatList):
 *   <FlatList
 *     refreshControl={
 *       <SilverstoneRefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
 *     }
 *   />
 *
 * The `title` prop shows below the spinner on iOS (Android ignores it).
 */

import React from 'react';
import { RefreshControl, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SilverstoneRefreshControl({
  refreshing,
  onRefresh,
  title,
  ...rest
}) {
  const { theme } = useTheme();

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      // iOS: tint is the spinner color
      tintColor={theme.primary}
      // Android: colors is an array cycling through the arcs
      colors={[theme.primary, theme.gradPrimA, theme.gradPrimB]}
      // Android: background behind the circle
      progressBackgroundColor={theme.surface}
      // iOS: small label under the spinner
      title={title ?? 'Refreshing...'}
      titleColor={theme.textDim}
      {...rest}
    />
  );
}
