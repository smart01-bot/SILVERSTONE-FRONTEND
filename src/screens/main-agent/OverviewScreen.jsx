import { WingLoader, BrandRefreshControl, RefreshIndicator } from '../../components/Loader';
import React from 'react';
import { View,Text,ScrollView,StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useMainCollection } from '../../hooks/useMainCollection';
import { MainHeader,MainEmpty,MainError } from '../../components/agent/MainAgentUI';
import { AgentButton } from '../../components/agent/AgentUI';
import PressFeedback from '../../components/PressFeedback';
import { fonts } from '../../constants/theme';
import { formatTzs } from '../../api/exchanges';
import { requestStatusLabel } from '../../api/presentation';
import { networkDisplayName } from '../../components/agent/agentPresentation';
import { Ionicons } from '@expo/vector-icons';

export default function OverviewScreen({navigation}) {
  const {theme,lang}=useTheme(),{profile}=useAuth();const copy=(en,sw)=>lang==='sw'?sw:en;
  const requests=useMainCollection('requests'),agents=useMainCollection('agents');
  const agentNames=Object.fromEntries(agents.rows.map(a=>[a.id,a.name]));
  const pending=requests.rows.filter(r=>r.status==='awaiting_review').length;
  const unresolved=requests.rows.filter(r=>r.status==='needs_attention'||r.legs?.some(l=>l.status==='unknown')).length;
  const completed=requests.rows.filter(r=>r.status==='completed');
  const volume=completed.reduce((sum,r)=>sum+BigInt(r.amount||0),0n);
  const refresh=()=>Promise.all([requests.refresh(),agents.refresh()]);
  return <SafeAreaView edges={['top','left','right']} style={[s.root,{backgroundColor:theme.bg}]}>
    <MainHeader navigation={navigation} title={copy('Overview','Muhtasari')} subtitle={profile?.name}/>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}
      refreshControl={<BrandRefreshControl refreshing={requests.refreshing||agents.refreshing} onRefresh={refresh} colors={[theme.text]} tintColor={theme.text}/> }>
      <RefreshIndicator refreshing={requests.refreshing||agents.refreshing} color={theme.text} />
      <View style={[s.hero,{backgroundColor:theme.text}]}>
        <Text style={[s.heroLabel,{color:theme.bg}]}>{copy('Your agency, coordinated.','Uwakala wako, umeunganishwa.')}</Text>
        <Text style={[s.heroTitle,{color:theme.bg}]}>{copy('Review.\nKeep float moving.','Kagua.\nEndeleza float.')}</Text>
        <Text style={[s.heroSub,{color:theme.bg}]}>{requests.loading?'…':copy(`${pending} requests awaiting your review`,`${pending} maombi yanasubiri ukaguzi wako`)}</Text>
        <AgentButton label={copy('Open queue','Fungua foleni')} variant="text" icon="list-outline" style={{backgroundColor:theme.bg}} onPress={()=>navigation.navigate('Queue')}/>
      </View>
      <MainError message={requests.error||agents.error} onRetry={refresh} busy={requests.refreshing||agents.refreshing}/>
      <View style={[s.metrics,{borderColor:theme.border}]}>
        {[ [copy('Awaiting review','Yanasubiri ukaguzi'),requests.loading||requests.error?'—':pending,'Queue'],
          [copy('Approved agents','Wakala walioidhinishwa'),agents.loading||agents.error?'—':agents.rows.length,'Agents'],
          [copy('Needs attention','Yanahitaji uhakiki'),requests.loading||requests.error?'—':unresolved,'Queue'] ].map(([label,value,route])=>
          <PressFeedback key={label} onPress={()=>navigation.navigate(route)} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} containerStyle={{flex:1,minWidth:80}} style={s.metric}>
            <Text style={[s.metricNumber,{color:theme.text}]}>{value}</Text><Text style={[s.metricLabel,{color:theme.textDim}]}>{label}</Text>
          </PressFeedback>)}
      </View>
      <View style={s.volume}><Text style={[s.sectionTitle,{color:theme.text}]}>{copy('Completed volume','Kiasi kilichokamilika')}</Text>
        <Text style={[s.volumeAmount,{color:theme.text}]}>{requests.loading||requests.error?'—':`TZS ${formatTzs(volume)}`}</Text>
        <Text style={[s.metricLabel,{color:theme.textDim}]}>{copy('Across your loaded completed exchanges','Katika miamala yako iliyopakiwa na kukamilika')}</Text>
      </View>
      <View style={s.sectionHeading}><Text style={[s.sectionTitle,{color:theme.text}]}>{copy('Recent requests','Maombi ya karibuni')}</Text></View>
      {requests.loading?<WingLoader color={theme.text}/>:!requests.rows.length&&!requests.error
        ?<MainEmpty title={copy('No requests yet','Bado hakuna maombi')} description={copy('Requests from your assigned agents appear here.','Maombi kutoka kwa wakala wako yataonekana hapa.')}/>
        :requests.rows.slice(0,5).map(r=><PressFeedback key={r.id} onPress={()=>navigation.navigate('Queue')} accessibilityRole="button" accessibilityLabel={`${r.agentName||agentNames[r.agentId||r.subAgentId]||copy('Agent','Wakala')}, TZS ${formatTzs(r.amount)}`} style={[s.request,{borderColor:theme.border}]}>
          <View style={{flex:1,gap:5}}><Text style={[s.requestName,{color:theme.text}]}>{r.agentName||agentNames[r.agentId||r.subAgentId]||copy('Agent','Wakala')}</Text>
            <Text style={[s.metricLabel,{color:theme.textDim}]}>{networkDisplayName(r.sourceNetwork)} → {networkDisplayName(r.destNetwork)}</Text>
            <Text style={[s.metricLabel,{color:theme.textDim}]}>{requestStatusLabel(r.status)}</Text></View>
          <Text style={[s.requestAmount,{color:theme.text}]}>{`TZS ${formatTzs(r.amount)}`}</Text><Ionicons name="chevron-forward" size={18} color={theme.textDim}/>
        </PressFeedback>)}
    </ScrollView>
  </SafeAreaView>;
}
const s=StyleSheet.create({root:{flex:1},content:{paddingHorizontal:24,paddingBottom:24},hero:{padding:24,borderRadius:26,gap:12},
  heroLabel:{fontFamily:fonts.bodyMed,fontSize:15,lineHeight:23},heroTitle:{fontFamily:fonts.display,fontSize:33,lineHeight:41,letterSpacing:-0.8},heroSub:{fontFamily:fonts.body,fontSize:15,lineHeight:23,marginBottom:8},
  metrics:{flexDirection:'row',flexWrap:'wrap',borderBottomWidth:1,marginTop:22,paddingBottom:18,gap:10},metric:{minHeight:90,paddingVertical:10,gap:7},metricNumber:{fontFamily:fonts.display,fontSize:30,lineHeight:39},metricLabel:{fontFamily:fonts.body,fontSize:13,lineHeight:20},
  volume:{paddingVertical:24,gap:8},volumeAmount:{fontFamily:fonts.display,fontSize:29,lineHeight:38,letterSpacing:-0.5},sectionTitle:{fontFamily:fonts.bodySemi,fontSize:18,lineHeight:26},sectionHeading:{paddingVertical:12},
  request:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',paddingVertical:20,gap:12,borderBottomWidth:StyleSheet.hairlineWidth},requestName:{fontFamily:fonts.bodySemi,fontSize:17,lineHeight:24},requestAmount:{fontFamily:fonts.bodySemi,fontSize:18,lineHeight:25,fontVariant:['tabular-nums']},
});
