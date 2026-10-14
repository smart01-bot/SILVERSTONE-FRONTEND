import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { ThemeContext, useTheme } from '../../context/ThemeContext';
import { agentColors } from './agentTheme';
import { AgentUIProvider, AgentButton } from './AgentUI';
import SilverstoneMark from '../SilverstoneMark';
import PressFeedback from '../PressFeedback';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/theme';

// Scoped palette: legacy review/operations components inherit the same visual system.
export function MainAgentUIProvider({ children }) {
  const base = useTheme();
  const value = useMemo(() => {
    const c = agentColors(base.isDark);
    return { ...base, theme: { ...base.theme, ...c, textMid:c.text, textDim:c.secondary,
      surfaceAlt:c.surface, surfaceElev:c.surface, borderStrong:c.strongBorder,
      primary:c.text, onPrimary:c.bg, primaryLight:c.selected,
      gradPrimA:c.text,gradPrimB:c.text,gradSurfA:c.surface,gradSurfB:c.surface,
      success:base.isDark?'#86D6AE':'#246347',warning:base.isDark?'#E6C178':'#765611',
      danger:c.danger,info:c.secondary,
    }};
  }, [base.theme,base.isDark,base.lang,base.userPreference,base.setTheme,base.setLang,base.tr]);
  return <ThemeContext.Provider value={value}><AgentUIProvider>{children}</AgentUIProvider></ThemeContext.Provider>;
}
export function MainHeader({ navigation, title, subtitle, action, actionLabel, actionIcon='options-outline' }) {
  const { theme, isDark, lang } = useTheme();
  return <View style={{backgroundColor:theme.bg}}>
    <StatusBar barStyle={isDark?'light-content':'dark-content'} backgroundColor={theme.bg} />
    <View style={s.brandRow}>
      <View accessible accessibilityLabel="Silverstone" style={s.brand}>
        <SilverstoneMark color={theme.text}/><Text style={[s.brandName,{color:theme.text}]}>SILVERSTONE</Text>
      </View>
      {navigation?.openDrawer && <PressFeedback onPress={()=>navigation.openDrawer()} accessibilityRole="button"
        accessibilityLabel={lang==='sw'?'Fungua menyu':'Open menu'} style={[s.icon,{backgroundColor:theme.glass,borderColor:theme.glassBorder}]}>
        <Ionicons name="menu-outline" size={24} color={theme.text}/>
      </PressFeedback>}
      {action && <PressFeedback onPress={action} accessibilityRole="button" accessibilityLabel={actionLabel}
        style={[s.icon,{backgroundColor:theme.glass,borderColor:theme.glassBorder}]}>
        <Ionicons name={actionIcon} size={23} color={theme.text}/>
      </PressFeedback>}
    </View>
    <View style={s.heading}>
      <Text accessibilityRole="header" style={[s.title,{color:theme.text}]}>{title}</Text>
      {subtitle ? <Text style={[s.subtitle,{color:theme.textDim}]}>{subtitle}</Text>:null}
    </View>
  </View>;
}
export function MainEmpty({ title, description, icon='reader-outline' }) {
  const { theme } = useTheme();
  return <View style={s.empty}>
    <View style={[s.emptyIcon,{backgroundColor:theme.surface,borderColor:theme.border}]}><Ionicons name={icon} size={32} color={theme.text}/></View>
    <Text style={[s.emptyTitle,{color:theme.text}]}>{title}</Text>
    <Text style={[s.subtitle,{color:theme.textDim,textAlign:'center'}]}>{description}</Text>
  </View>;
}
export function MainError({ message, onRetry, busy }) {
  const {theme,lang}=useTheme();
  if(!message)return null;
  return <View style={{paddingVertical:16,gap:8}}><Text accessibilityRole="alert" style={[s.subtitle,{color:theme.danger}]}>{message}</Text>
    <AgentButton variant="text" icon="refresh-outline" label={lang==='sw'?'Jaribu tena':'Retry loading'} onPress={onRetry} disabled={busy} busy={busy}/></View>;
}
const s=StyleSheet.create({
  brandRow:{paddingHorizontal:24,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:8},
  brand:{flex:1,flexDirection:'row',alignItems:'center',gap:8},brandName:{fontFamily:fonts.bodySemi,fontSize:12,flexShrink:1},
  icon:{width:48,height:48,borderRadius:24,borderWidth:1,alignItems:'center',justifyContent:'center'},
  heading:{paddingHorizontal:24,paddingTop:4,paddingBottom:16,gap:7},title:{fontFamily:fonts.display,fontSize:29,lineHeight:38,letterSpacing:-0.8},
  subtitle:{fontFamily:fonts.body,fontSize:14,lineHeight:22},empty:{paddingVertical:40,alignItems:'center',gap:14},
  emptyIcon:{width:76,height:80,borderRadius:24,borderWidth:1,alignItems:'center',justifyContent:'center'},
  emptyTitle:{fontFamily:fonts.bodySemi,fontSize:20,lineHeight:28,textAlign:'center'},
});
