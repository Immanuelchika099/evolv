import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, Upload, Pencil, ChevronLeft, ChevronRight, ChevronDown, Check, X, Trash2, Download, ArrowUpRight, Bell, ShieldCheck, UserRound, Target, Activity, LogOut, Settings, Compass } from 'lucide-react'
import { AvatarPortrait, AvatarStudio, DEFAULT_AVATAR } from './AvatarStudio'
import { supabase } from '../lib/supabase'
import '../styles/tokens.css'
import './styles/ProfileFixes.css'

const DEFAULT_SETTINGS = {weeklyGoalTarget:3,weekStart:'monday',streakAlerts:true,weeklySummary:true,units:'metric',animations:true,language:'English'}

function dateKey(value){return value?new Date(value).toLocaleDateString('en-CA'):null}
function streaksFor(items){
  const dates=[...new Set(items.map(item=>dateKey(item.logged_at||item.created_at||item.eaten_at)).filter(Boolean))].sort()
  const set=new Set(dates),today=new Date()
  let current=0,cursor=new Date(today)
  if(!set.has(dateKey(cursor)))cursor.setDate(cursor.getDate()-1)
  while(set.has(dateKey(cursor))){current++;cursor.setDate(cursor.getDate()-1)}
  let best=0,run=0,previous=null
  dates.forEach(key=>{const d=new Date(key+'T12:00:00');run=previous&&Math.round((d-previous)/86400000)===1?run+1:1;best=Math.max(best,run);previous=d})
  return {current,best}
}
function ProfileSettingsSection({label,title,children,danger=false,icon:Icon=ShieldCheck}) {
  const [open,setOpen]=useState(false)
  return <section className={'profile-settings-section profile-accordion '+(danger?'danger-section':'')}>
    <button type="button" className="profile-settings-section-head" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>
      <span className={'profile-settings-section-icon icon-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+(danger?' icon-danger':'')}><Icon size={19} strokeWidth={1.9}/></span>
      <span className="profile-settings-section-heading"><span className="section-label">{label}</span><strong>{title}</strong></span>
      <ChevronDown className={'profile-settings-chevron '+(open?'is-open':'')} size={19} aria-hidden="true"/>
    </button>
    <div className={'profile-settings-accordion-content '+(open?'is-open':'')} aria-hidden={!open} inert={!open}>
      <div className="profile-settings-list">{children}</div>
    </div>
  </section>
}
function SettingToggle({label,description,checked,onChange}){return <div className="profile-setting-row"><div><strong>{label}</strong><span>{description}</span></div><button type="button" className={checked?'settings-toggle active':'settings-toggle'} onClick={()=>onChange(!checked)} aria-pressed={checked} aria-label={label+(checked?' on':' off')}><span/></button></div>}
function SettingSelect({label,description,value,onChange,options}){return <label className="profile-setting-row profile-setting-control-row"><span className="profile-setting-copy"><strong>{label}</strong><small>{description}</small></span><select value={value} onChange={e=>onChange(e.target.value)} aria-label={label}>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}

export default function ProfileSettingsPage({pageProps}){
  const {profile,profileName,setProfileName,data,logs=[],meals=[],goals=[],avatarUrl,notificationsEnabled,toggleNotifications,notificationTimes,saveNotificationTime,toggleQuietHours,saveQuietHour,deleteAccount,deleting,onLogout,loading}=pageProps
  const [user,setUser]=useState(null)
  const [settings,setSettings]=useState(DEFAULT_SETTINGS)
  const [draft,setDraft]=useState({name:profileName||'',email:profile?.email||'',bio:''})
  const [editOpen,setEditOpen]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('')
  const [toast,setToast]=useState(''),[toastError,setToastError]=useState(false),[confirmAction,setConfirmAction]=useState(null),[resetting,setResetting]=useState(false)
  const [avatarPreview,setAvatarPreview]=useState(''),[avatarBusy,setAvatarBusy]=useState(false),[localAvatar,setLocalAvatar]=useState(avatarUrl||''),[unsaved,setUnsaved]=useState(false)
  const [avatarStudioOpen,setAvatarStudioOpen]=useState(false)
  const [photoMenuOpen,setPhotoMenuOpen]=useState(false)
  const [profileTab,setProfileTab]=useState('account')
  const [focusExpanded,setFocusExpanded]=useState(false)
  const [focusDraft,setFocusDraft]=useState(profile?.focus||data?.focus||'')
  const [growthDraft,setGrowthDraft]=useState(profile?.growth_areas||data?.areas||[])
  const [directionSaving,setDirectionSaving]=useState(false)
  const [avatarStyle,setAvatarStyle]=useState(()=>{try{return {...DEFAULT_AVATAR,...JSON.parse(localStorage.getItem('evolv-avatar-preferences')||'{}')}}catch{return {...DEFAULT_AVATAR}}})
  const settingsKey=user?.id?'evolv-profile-settings-'+user.id:null

  useEffect(()=>{let mounted=true;(async()=>{const {data:a}=await supabase.auth.getUser();if(!mounted||!a?.user)return;const current=a.user;const {data:p}=await supabase.from('profiles').select('id,first_name,growth_areas,focus,first_goal,created_at,avatar_url').eq('id',current.id).maybeSingle();if(!mounted)return;setUser(current);setDraft({name:p?.first_name||profileName||'',email:current.email||'',bio:current.user_metadata?.bio||''});setLocalAvatar(p?.avatar_url||current.user_metadata?.avatar_url||avatarUrl||'')})();return()=>{mounted=false}},[])
  useEffect(()=>{setFocusDraft(profile?.focus||data?.focus||'');setGrowthDraft(profile?.growth_areas||data?.areas||[])},[profile?.focus,profile?.growth_areas,data?.focus,data?.areas])
  useEffect(()=>{if(!settingsKey)return;try{const next={...DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem(settingsKey)||'{}')};setSettings(next);document.documentElement.classList.toggle('evolv-reduced-motion',next.animations===false)}catch{}},[settingsKey])
  useEffect(()=>{if(!editOpen)setDraft(d=>({...d,name:profileName||d.name,email:profile?.email||d.email,bio:user?.user_metadata?.bio||d.bio}))},[profileName,profile?.email,user?.user_metadata?.bio,editOpen])
  useEffect(()=>{
    if(!editOpen)return
    const previousOverflow=document.body.style.overflow
    const previousOverscroll=document.body.style.overscrollBehavior
    document.body.style.overflow='hidden'
    document.body.style.overscrollBehavior='none'
    const onKeyDown=e=>{if(e.key==='Escape'){e.preventDefault();setEditOpen(false);setUnsaved(false)}}
    window.addEventListener('keydown',onKeyDown)
    return()=>{document.body.style.overflow=previousOverflow;document.body.style.overscrollBehavior=previousOverscroll;window.removeEventListener('keydown',onKeyDown)}
  },[editOpen])
  useEffect(()=>{const beforeUnload=e=>{if(!unsaved)return;e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',beforeUnload);return()=>window.removeEventListener('beforeunload',beforeUnload)},[unsaved])
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3200);return()=>clearTimeout(t)},[toast])
  useEffect(()=>()=>{if(avatarPreview)URL.revokeObjectURL(avatarPreview)},[avatarPreview])

  function showToast(message,isError=false){setToastError(isError);setToast(message)}
  function updateAvatarStyle(updated){setAvatarStyle(updated);try{localStorage.setItem('evolv-avatar-preferences',JSON.stringify(updated))}catch{};window.dispatchEvent(new CustomEvent('evolv-avatar-updated'))}
  function updateSetting(key,value){const next={...settings,[key]:value};setSettings(next);if(settingsKey)localStorage.setItem(settingsKey,JSON.stringify(next));if(key==='animations')document.documentElement.classList.toggle('evolv-reduced-motion',value===false);window.dispatchEvent(new CustomEvent('evolv-settings-updated',{detail:next}));try{const stored=JSON.parse(localStorage.getItem('evolv-notification-times')||'{}');const preferences={...stored,streakAlerts:next.streakAlerts,weeklySummary:next.weeklySummary};localStorage.setItem('evolv-notification-times',JSON.stringify(preferences));if(localStorage.getItem('evolv-notifications-enabled')==='true'){(async()=>{const registration=await navigator.serviceWorker?.ready;const subscription=await registration?.pushManager?.getSubscription();if(!subscription)return;const result=await supabase.functions.invoke('save-push-subscription',{body:{subscription:subscription.toJSON(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Africa/Lagos',preferences,enabled:true}});if(result.error)throw result.error})().catch(error=>{console.error('Could not save notification preferences:',error);showToast('Preference saved, but push sync failed.',true)})}}catch(error){console.error('Could not save notification preferences:',error)}showToast('Preference saved.')}
  function beginEdit(){setDraft({name:profileName||'',email:user?.email||profile?.email||'',bio:user?.user_metadata?.bio||''});setError('');setUnsaved(false);setEditOpen(true)}
  async function saveDirection(){
    if(!user?.id){showToast('Sign in again to update your focus and growth areas.',true);return}
    setDirectionSaving(true)
    try{
      const {data:updated,error:saveError}=await supabase.from('profiles').update({focus:focusDraft,growth_areas:growthDraft,updated_at:new Date().toISOString()}).eq('id',user.id).select('id,first_name,growth_areas,focus,first_goal,created_at,avatar_url').single()
      if(saveError)throw saveError
      window.dispatchEvent(new CustomEvent('evolv-profile-updated',{detail:updated}))
      showToast('Focus and growth areas saved.')
    }catch(err){showToast(err?.message||'Could not save your direction.',true)}
    finally{setDirectionSaving(false)}
  }
  function toggleGrowthArea(area){
    setGrowthDraft(current=>current.includes(area)?current.filter(item=>item!==area):[...current,area])
  }
  function cancelEdit(){beginEdit();setEditOpen(false);setUnsaved(false)}
  async function saveProfile(e){
    e.preventDefault();const name=draft.name.trim(),email=draft.email.trim().toLowerCase(),bio=draft.bio.trim()
    if(!name||name.length>80)return setError('Name is required and must be 80 characters or fewer.')
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return setError('Enter a valid email address.')
    if(bio.length>180)return setError('Bio must be 180 characters or fewer.')
    setSaving(true);setError('')
    try{
      const {data:a,error:ae}=await supabase.auth.getUser();const current=a?.user;if(ae||!current)throw ae||new Error('Your session has expired.')
      const {data:p,error:pe}=await supabase.from('profiles').update({first_name:name,updated_at:new Date().toISOString()}).eq('id',current.id).select('id,first_name,growth_areas,focus,first_goal,created_at,avatar_url').single();if(pe)throw pe
      const {data:updated,error:ue}=await supabase.auth.updateUser({...email!==current.email?{email}: {},data:{...(current.user_metadata||{}),bio}});if(ue)throw ue
      setUser(updated?.user||current);setProfileName(name);setDraft({name,email:updated?.user?.email||email,bio});setEditOpen(false);setUnsaved(false)
      window.dispatchEvent(new CustomEvent('evolv-profile-updated',{detail:{...p,email:updated?.user?.email||email,user_metadata:updated?.user?.user_metadata||{bio}}}))
      showToast(email!==current.email?'Profile saved. Check your email to confirm the new address.':'Profile saved.')
    }catch(err){setError(err?.message||'Could not save your profile.');showToast('Could not save your profile.',true)}finally{setSaving(false)}
  }
  async function handleAvatar(e){
    const file=e.target.files?.[0];if(!file)return
    if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))return showToast('Use a JPG, PNG, WEBP or GIF image.',true)
    if(file.size>6*1024*1024)return showToast('Choose an image smaller than 6 MB.',true)
    const preview=URL.createObjectURL(file);if(avatarPreview)URL.revokeObjectURL(avatarPreview);setAvatarPreview(preview);setAvatarBusy(true)
    try{
      const {data:a,error:ae}=await supabase.auth.getUser();const current=a?.user;if(ae||!current)throw ae||new Error('Your session has expired.')
      const path=current.id+'/avatar',storage=supabase.storage.from('avatars');const {error:uploadError}=await storage.upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'});if(uploadError)throw uploadError
      const {data:pub}=storage.getPublicUrl(path),url=pub?.publicUrl;if(!url)throw new Error('Could not create the profile photo URL.')
      const {error:pe}=await supabase.from('profiles').update({avatar_url:url,updated_at:new Date().toISOString()}).eq('id',current.id);if(pe)throw pe
      const {error:ue}=await supabase.auth.updateUser({data:{...(current.user_metadata||{}),avatar_url:url}});if(ue)throw ue
      setLocalAvatar(url+'?v='+Date.now());window.dispatchEvent(new CustomEvent('evolv-profile-updated',{detail:{avatar_url:url}}));showToast('Profile photo updated.')
    }catch(err){showToast(err?.message||'Could not update your profile photo.',true)}finally{setAvatarBusy(false);e.target.value='';setTimeout(()=>setAvatarPreview(''),1000)}
  }
  async function removeAvatar(){if(!user?.id)return;setAvatarBusy(true);try{const storage=supabase.storage.from('avatars');const {error:se}=await storage.remove([user.id+'/avatar']);if(se&&se.statusCode!=='404')throw se;const {error:pe}=await supabase.from('profiles').update({avatar_url:null,updated_at:new Date().toISOString()}).eq('id',user.id);if(pe)throw pe;const {error:ue}=await supabase.auth.updateUser({data:{...(user.user_metadata||{}),avatar_url:null}});if(ue)throw ue;setLocalAvatar('');window.dispatchEvent(new CustomEvent('evolv-profile-updated',{detail:{avatar_url:null}}));showToast('Profile photo removed.')}catch(err){showToast(err?.message||'Could not remove your profile photo.',true)}finally{setAvatarBusy(false)}}
  async function exportData(){try{const blob=new Blob([JSON.stringify({exported_at:new Date().toISOString(),profile,auth_user:{id:user?.id,email:user?.email,created_at:user?.created_at,user_metadata:user?.user_metadata},logs,meals,goals,notifications:pageProps.notifications||[],preferences:settings},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='evolv-data-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(url);showToast('Your EVOLV data was exported.')}catch{showToast('Could not export your data.',true)}}
  async function resetHabitData(){setResetting(true);try{if(!user?.id)throw new Error('Your session has expired.');for(const [table,column] of [['goal_checkins','user_id'],['daily_reflections','user_id'],['notification_delivery_log','user_id'],['push_subscriptions','user_id'],['metric_logs','user_id'],['meal_logs','user_id'],['goals','user_id']]){const {error}=await supabase.from(table).delete().eq(column,user.id);if(error)throw error}setConfirmAction(null);window.dispatchEvent(new Event('evolv-tracking-updated'));showToast('Habit data reset.');setTimeout(()=>window.location.reload(),500)}catch(err){showToast(err?.message||'Could not reset habit data.',true)}finally{setResetting(false)}}

  async function handleConfirmedAction(){
    const action = confirmAction
    if(!action) return

    if(action === 'reset'){
      await resetHabitData()
      return
    }

    setConfirmAction(null)
    if(action === 'logout'){
      try{
        await onLogout()
      }catch(err){
        showToast(err?.message || 'Could not log out. Please try again.', true)
      }
      return
    }

    if(action === 'delete'){
      try{
        const result = await deleteAccount()
        if(result === false) showToast('Could not start account deletion. Please try again.', true)
      }catch(err){
        showToast(err?.message || 'Could not delete your account. Please try again.', true)
      }
    }
  }

  const allActivity=useMemo(()=>[...logs,...meals],[logs,meals]),streaks=useMemo(()=>streaksFor(allActivity),[allActivity]),memberSince=user?.created_at||profile?.created_at?new Date(user?.created_at||profile?.created_at).toLocaleDateString(undefined,{month:'short',year:'numeric'}):'—',completed=allActivity.length,initials=profileName.trim().split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase()||'E',displayAvatar=avatarPreview||localAvatar||avatarUrl,firstName=profileName.trim().split(/\s+/)[0]||'There'

  const activityDates = new Set(allActivity.map(item => dateKey(item.logged_at || item.created_at || item.eaten_at)).filter(Boolean))
  const today = new Date()
  const monday = new Date(today)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const daysThisWeek = new Set([...activityDates].filter(key => { const date = new Date(key + 'T12:00:00'); return date >= monday && date <= today })).size
  const goalTarget = Math.max(1, Number(settings.weeklyGoalTarget) || 3)
  const goalProgress = Math.min(100, Math.round(daysThisWeek / goalTarget * 100))
  const focusLabel = profile?.focus || data?.focus || 'Choose your direction'
  const growthAreas = profile?.growth_areas || data?.areas || []

  if(loading&&!user)return <section className="panel-page dashboard-panel settings-page profile-v2 settings-loading" aria-busy="true"><header className="profile-v2-topbar"><span className="profile-v2-title">Profile</span></header><div className="settings-loading-line"/><div className="settings-loading-line short"/></section>

  return <section className="panel-page dashboard-panel settings-page profile-v2">
    {createPortal(<div className="profile-v2-top-scrim status-scrim" aria-hidden="true"/>, document.body)}
    <header className="profile-v2-topbar">
      <button type="button" className="profile-v2-icon-button" onClick={()=>pageProps.goTo?.('overview')} aria-label="Back to home"><ChevronLeft size={21}/></button>
      <h1 className="profile-v2-title">Profile</h1>
      <button type="button" className="profile-v2-icon-button" onClick={()=>setProfileTab('preferences')} aria-label="Open profile preferences"><Settings size={19}/></button>
    </header>
    <div className="profile-v2-summary">
      <div className="profile-v2-summary-main">
        <div className="profile-avatar-wrap profile-v2-avatar-wrap">
          <button type="button" className="profile-avatar-button profile-v2-avatar-button" onClick={()=>setPhotoMenuOpen(true)} disabled={avatarBusy} aria-label="Manage profile photo">
            {displayAvatar?<img src={displayAvatar} alt={firstName+" profile"} className="profile-avatar-image"/>:<span className="profile-avatar">{initials}</span>}
          </button>
          <span className="profile-avatar-camera" aria-hidden="true"><Camera size={15}/></span>
          <input id="profile-avatar-input" className="profile-avatar-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatar} aria-label="Choose profile photo"/>
        </div>
        <div className="profile-v2-identity"><h2>{profileName||"Your name"}</h2><p title={user?.email||profile?.email||"Account email"}>{user?.email||profile?.email||"Account email"}</p></div>
      </div>
      <section className="profile-v2-stats" aria-label="Your EVOLV progress">
        <div className="l"><strong>{completed}</strong><span>Check-ins</span></div><i aria-hidden="true"/><div className="c"><strong>{daysThisWeek}<small> / 7</small></strong><span>This week</span></div><i aria-hidden="true"/><div className="r"><strong>{goalProgress}%</strong><span>Goal</span></div>
      </section>
    </div>
    <div className="profile-v2-tabs" role="tablist" aria-label="Profile settings">
      <span className={'profile-v2-tab-indicator '+(profileTab==='preferences'?'is-preferences':'')} aria-hidden="true"/>
      <button type="button" role="tab" aria-selected={profileTab==='account'} className={profileTab==='account'?'is-active':''} onClick={()=>setProfileTab('account')}>Account</button>
      <button type="button" role="tab" aria-selected={profileTab==='preferences'} className={profileTab==='preferences'?'is-active':''} onClick={()=>setProfileTab('preferences')}>Preferences</button>
    </div>
    <div key={profileTab} className="profile-v2-tab-content">
      {profileTab==='account' ? <>
        <div className="profile-v2-group"><p className="profile-v2-group-label">Your journey</p>
          <ProfileSettingsSection label="YOUR JOURNEY" title="Streak & stats" icon={Activity}>
            <section className="profile-stat-grid profile-v2-stat-details" aria-label="Detailed EVOLV statistics"><article><span>STREAK</span><strong>{streaks.current}</strong><small>current days</small></article><article><span>COMPLETED</span><strong>{completed}</strong><small>saved entries</small></article><article><span>BEST STREAK</span><strong>{streaks.best}</strong><small>best run</small></article><article><span>MEMBER SINCE</span><strong>{memberSince}</strong><small>your EVOLV start</small></article></section>
          </ProfileSettingsSection>
        </div>
        <div className="profile-v2-group"><p className="profile-v2-group-label">Your details</p>
          <ProfileSettingsSection label="YOUR DETAILS" title="Account" icon={UserRound}>
            <div className="profile-setting-row"><div><strong>Name</strong><span>Your display name across EVOLV.</span></div><button type="button" className="settings-inline-action" onClick={beginEdit}>Edit <ChevronRight size={15}/></button></div>
            <div className="profile-setting-row profile-setting-row-wide"><div><strong>Email</strong><span>Managed securely by your EVOLV account.</span></div><button type="button" className="settings-inline-action" onClick={beginEdit}>{user?.email||'Add email'} <ChevronRight size={15}/></button></div>
            <div className="profile-setting-row"><div><strong>Bio</strong><span>A short line shown on your profile.</span></div><button type="button" className="settings-inline-action" onClick={beginEdit}>{draft.bio?'Edit bio':'Add bio'} <ChevronRight size={15}/></button></div>
            <div className="profile-setting-row"><div><strong>Edit profile</strong><span>Update your name and personal details.</span></div><button type="button" className="settings-inline-action" onClick={beginEdit}>Edit <ChevronRight size={15}/></button></div>
          </ProfileSettingsSection>
        </div>
        <div className="profile-v2-group"><p className="profile-v2-group-label">Your routine</p>
          <button type="button" className="profile-setting-row profile-v2-focus-row" aria-expanded={focusExpanded} onClick={()=>setFocusExpanded(value=>!value)}><span className="profile-v2-focus-icon" aria-hidden="true"><Compass size={19}/></span><span className="profile-v2-focus-copy"><strong>Focus &amp; growth areas</strong><small>Choose your direction · {growthAreas.length||0} selected</small></span><ChevronDown size={18} className={focusExpanded?"profile-v2-focus-chevron is-open":"profile-v2-focus-chevron"}/></button>
          <div className={focusExpanded?"profile-v2-focus-more is-open":"profile-v2-focus-more"} aria-hidden={!focusExpanded} inert={!focusExpanded}><div className="profile-v2-direction-editor">
            <label className="profile-v2-focus-select"><span>Primary focus</span><select value={focusDraft} onChange={event=>setFocusDraft(event.target.value)}><option value="">Choose your direction</option>{focusDraft&&!['Career','Skills','Money','Life','Health','Creative'].includes(focusDraft)&&<option value={focusDraft}>{focusDraft}</option>}{['Career','Skills','Money','Life','Health','Creative'].map(option=><option key={option} value={option}>{option}</option>)}</select></label>
            <fieldset className="profile-v2-growth-options"><legend>Growth areas</legend>{[{id:'career',title:'Career'},{id:'skills',title:'Skills'},{id:'money',title:'Money'},{id:'life',title:'Life'},{id:'health',title:'Health'},{id:'creative',title:'Creative'}].map(area=><label key={area.id} className={growthDraft.includes(area.id)?'is-selected':''}><input type="checkbox" checked={growthDraft.includes(area.id)} onChange={()=>toggleGrowthArea(area.id)}/><span>{area.title}</span></label>)}</fieldset>
            <button type="button" className="profile-v2-direction-save" onClick={saveDirection} disabled={directionSaving}>{directionSaving?'Saving…':'Save changes'} <Check size={15}/></button>
          </div></div>
          <ProfileSettingsSection label="YOUR ROUTINE" title="Goals & habits" icon={Target}>
            <SettingSelect label="Weekly goal target" description="How many focused check-ins you want each week." value={settings.weeklyGoalTarget} onChange={v=>updateSetting('weeklyGoalTarget',Number(v))} options={[1,2,3,4,5,6,7].map(v=>({value:v,label:v+' '+(v===1?'check-in':'check-ins')}))}/>
            <label className="profile-setting-row profile-setting-control-row"><span className="profile-setting-copy"><strong>Default reminder time</strong><small>Used as the starting time for your daily reminder.</small></span><input type="time" value={notificationTimes.morningTime||'08:00'} onChange={e=>saveNotificationTime('morningTime',e)} aria-label="Default reminder time"/></label>
            <SettingSelect label="Week starts" description="Choose how weekly progress is grouped." value={settings.weekStart} onChange={v=>updateSetting('weekStart',v)} options={[{value:'monday',label:'Monday'},{value:'sunday',label:'Sunday'}]}/>
          </ProfileSettingsSection>
        </div>
      </> : <>
        <div className="profile-v2-group"><p className="profile-v2-group-label">Stay in the loop</p>
          <ProfileSettingsSection label="STAY IN THE LOOP" title="Notifications" icon={Bell}>
            <SettingToggle label="Daily reminders" description="Your existing morning, midday and evening reminders." checked={notificationsEnabled} onChange={toggleNotifications}/>
            <SettingToggle label="Streak alerts" description="Keep a quiet nudge when a streak is at risk." checked={settings.streakAlerts} onChange={v=>updateSetting('streakAlerts',v)}/>
            <SettingToggle label="Weekly summary" description="Keep a weekly view of how consistently you showed up." checked={settings.weeklySummary} onChange={v=>updateSetting('weeklySummary',v)}/>
            <div className="profile-setting-row profile-setting-row-nested profile-setting-row-wide"><div><strong>Reminder schedule</strong><span>Existing EVOLV reminder times.</span></div><span className="settings-value">{notificationTimes.morningTime} · {notificationTimes.hydrationTime} · {notificationTimes.reflectionTime}</span></div>
            <div className="profile-setting-row profile-setting-row-nested profile-setting-row-wide"><div><strong>Quiet hours</strong><span>EVOLV will not interrupt this window.</span></div><div className="settings-quiet-control"><input type="time" value={notificationTimes.quietStart||'23:00'} onChange={e=>saveQuietHour('quietStart',e)} aria-label="Quiet hours start"/><span>to</span><input type="time" value={notificationTimes.quietEnd||'07:00'} onChange={e=>saveQuietHour('quietEnd',e)} aria-label="Quiet hours end"/><button type="button" className={notificationTimes.quietHours?'settings-toggle active':'settings-toggle'} onClick={toggleQuietHours} aria-pressed={notificationTimes.quietHours} aria-label="Toggle quiet hours"><span/></button></div></div>
          </ProfileSettingsSection>
        </div>
        <div className="profile-v2-group"><p className="profile-v2-group-label">Your information</p>
          <ProfileSettingsSection label="YOUR INFORMATION" title="Privacy & data" icon={ShieldCheck}>
            <div className="profile-setting-row"><div><strong>Export my data</strong><span>Download your tracked EVOLV data as JSON.</span></div><button type="button" className="settings-inline-action" onClick={exportData}><Download size={15}/> Export</button></div>
            <div className="profile-setting-row danger-row"><div><strong>Reset all habit data</strong><span>Remove logs, meals, goals and reflections without deleting your account.</span></div><button type="button" className="settings-danger-button" onClick={()=>setConfirmAction('reset')}>Reset data</button></div>
          </ProfileSettingsSection>
        </div>
        <div className="profile-v2-group"><p className="profile-v2-group-label">Account actions</p>
          <section className="profile-settings-section profile-v2-actions" aria-label="Account actions">
            <div className="profile-v2-action-row"><span className="profile-v2-action-icon"><LogOut size={18}/></span><span className="profile-account-action-copy"><strong>Log out</strong><small>Sign out on this device. Your data stays saved.</small></span><button type="button" className="profile-v2-row-action" onClick={()=>setConfirmAction('logout')} aria-label="Log out"><ChevronRight size={18}/></button></div>
            <div className="profile-v2-action-row is-danger"><span className="profile-v2-action-icon"><Trash2 size={18}/></span><span className="profile-account-action-copy"><strong>Delete account</strong><small>Permanently remove your account and saved information.</small></span><button type="button" className="profile-v2-row-action" onClick={()=>setConfirmAction('delete')} aria-label="Delete account"><ChevronRight size={18}/></button></div>
          </section>
        </div>
      </>}
    </div>
    {photoMenuOpen&&createPortal(<div className="profile-modal-backdrop profile-photo-menu-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setPhotoMenuOpen(false)}><section className="profile-modal profile-photo-menu" role="dialog" aria-modal="true" aria-labelledby="profile-photo-menu-title"><div className="profile-modal-head"><div><span className="section-label">YOUR PHOTO</span><h3 id="profile-photo-menu-title">Profile photo</h3></div><button type="button" onClick={()=>setPhotoMenuOpen(false)} aria-label="Close photo options"><X size={18}/></button></div><button type="button" className="profile-photo-menu-option" onClick={()=>{setPhotoMenuOpen(false);document.getElementById('profile-avatar-input')?.click()}} disabled={avatarBusy}><Upload size={19}/><span><strong>{avatarBusy?'Uploading…':'Upload a photo'}</strong><small>Choose an image from your device.</small></span><ChevronRight size={17}/></button><button type="button" className="profile-photo-menu-option" onClick={()=>{setPhotoMenuOpen(false);setAvatarStudioOpen(true)}}><UserRound size={19}/><span><strong>Make an avatar</strong><small>Customise your EVOLV portrait.</small></span><ChevronRight size={17}/></button>{localAvatar&&<button type="button" className="profile-photo-menu-option profile-photo-remove-option" onClick={()=>{setPhotoMenuOpen(false);removeAvatar()}} disabled={avatarBusy}><Trash2 size={18}/><span><strong>Remove photo</strong><small>Return to your initials.</small></span><ChevronRight size={17}/></button>}</section></div>,document.body)}
    {avatarStudioOpen&&createPortal(<div className="profile-avatar-studio-portal"><AvatarStudio preferences={avatarStyle} onChange={updateAvatarStyle} onClose={()=>setAvatarStudioOpen(false)}/></div>,document.body)}
    {editOpen&&createPortal(<div className="profile-modal-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&cancelEdit()}><section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title"><div className="profile-modal-head"><div><span className="section-label">ACCOUNT</span><h3 id="profile-edit-title">Edit profile.</h3></div><button type="button" onClick={cancelEdit} aria-label="Close edit profile"><X size={18}/></button></div><form onSubmit={saveProfile}><label><span>Name</span><input autoFocus maxLength={80} value={draft.name} onChange={e=>{setDraft({...draft,name:e.target.value});setUnsaved(true)}}/></label><label><span>Email</span><input type="email" maxLength={320} value={draft.email} onChange={e=>{setDraft({...draft,email:e.target.value});setUnsaved(true)}}/></label><label><span>Bio <small>optional</small></span><textarea maxLength={180} rows="3" value={draft.bio} onChange={e=>{setDraft({...draft,bio:e.target.value});setUnsaved(true)}} placeholder="A short line about you."/></label>{error&&<p className="profile-inline-error" role="alert">{error}</p>}<div className="profile-modal-actions"><button type="button" className="settings-cancel-button" onClick={cancelEdit}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving?'Saving…':'Save changes'} <Check size={15}/></button></div></form></section></div>,document.body)}
    {confirmAction&&createPortal(<div className="profile-modal-backdrop confirmation-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setConfirmAction(null)}><section className="profile-modal confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="profile-confirm-title" aria-describedby="profile-confirm-copy"><div className={'confirmation-icon '+(confirmAction==='delete'?'is-destructive':'')}>{confirmAction==='delete'?<Trash2 size={19}/>:<Check size={19}/>}</div><span className="section-label">ARE YOU SURE</span><h3 id="profile-confirm-title">{confirmAction==='reset'?'Reset habit data?':confirmAction==='logout'?'Log out of EVOLV?':'Delete your account?'}</h3><p id="profile-confirm-copy">{confirmAction==='reset'?'This permanently removes your logs, meals, goals, reflections and notification history. Your account stays intact.':confirmAction==='logout'?'Your data remains saved. You can sign back in whenever you are ready.':'This permanently removes your EVOLV account and saved information. This cannot be undone.'}</p><div className="profile-modal-actions"><button type="button" className="settings-cancel-button" onClick={()=>setConfirmAction(null)}>Cancel</button><button type="button" className="settings-danger-button" disabled={resetting||deleting} onClick={handleConfirmedAction}>{resetting||deleting?'Working…':confirmAction==='reset'?'Reset data':confirmAction==='logout'?'Log out':'Delete account'}</button></div></section></div>,document.body)}
    {toast&&<div className={'profile-toast '+(toastError?'error':'')} role="status" aria-live="polite">{toast}</div>}
  </section>
}
