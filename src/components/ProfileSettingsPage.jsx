import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, Upload, Pencil, ChevronRight, Check, X, Trash2, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import '../styles/tokens.css'

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
function ProfileSettingsSection({label,title,children,danger=false}){return <section className={'profile-settings-section '+(danger?'danger-section':'')}><div className="profile-settings-section-head"><span className="section-label">{label}</span><h3>{title}</h3></div><div className="profile-settings-list">{children}</div></section>}
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
  const settingsKey=user?.id?'evolv-profile-settings-'+user.id:null

  useEffect(()=>{let mounted=true;(async()=>{const {data:a}=await supabase.auth.getUser();if(!mounted||!a?.user)return;const current=a.user;const {data:p}=await supabase.from('profiles').select('id,first_name,growth_areas,focus,first_goal,created_at,avatar_url').eq('id',current.id).maybeSingle();if(!mounted)return;setUser(current);setDraft({name:p?.first_name||profileName||'',email:current.email||'',bio:current.user_metadata?.bio||''});setLocalAvatar(p?.avatar_url||current.user_metadata?.avatar_url||avatarUrl||'')})();return()=>{mounted=false}},[])
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
  function updateSetting(key,value){const next={...settings,[key]:value};setSettings(next);if(settingsKey)localStorage.setItem(settingsKey,JSON.stringify(next));if(key==='animations')document.documentElement.classList.toggle('evolv-reduced-motion',value===false);window.dispatchEvent(new CustomEvent('evolv-settings-updated',{detail:next}));showToast('Preference saved.')}
  function beginEdit(){setDraft({name:profileName||'',email:user?.email||profile?.email||'',bio:user?.user_metadata?.bio||''});setError('');setUnsaved(false);setEditOpen(true)}
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

  const allActivity=useMemo(()=>[...logs,...meals],[logs,meals]),streaks=useMemo(()=>streaksFor(allActivity),[allActivity]),memberSince=user?.created_at||profile?.created_at?new Date(user?.created_at||profile?.created_at).toLocaleDateString(undefined,{month:'short',year:'numeric'}):'—',completed=allActivity.length,initials=profileName.trim().split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase()||'E',displayAvatar=avatarPreview||localAvatar||avatarUrl,firstName=profileName.trim().split(/\s+/)[0]||'There'

  if(loading&&!user)return <section className="panel-page dashboard-panel settings-page settings-loading" aria-busy="true"><span className="section-label">YOUR SPACE</span><h2>Profile.</h2><div className="settings-loading-line"/><div className="settings-loading-line short"/></section>

  return <section className="panel-page dashboard-panel settings-page">
    <div className="settings-heading"><span className="section-label">YOUR SPACE</span><h2>Profile.</h2><p>One quiet place for your account, preferences and journey.</p></div>
    <div className="profile-layout">
      <aside className="profile-summary-card">
        <div className="profile-summary-top">
          <div className="profile-avatar-wrap">
            <button type="button" className="profile-avatar-button" onClick={()=>document.getElementById('profile-avatar-input')?.click()} disabled={avatarBusy} aria-label="Change profile photo">{displayAvatar?<img src={displayAvatar} alt={firstName+' profile'} className="profile-avatar-image"/>:<span className="profile-avatar">{initials}</span>}<span className="profile-avatar-camera"><Camera size={16}/></span></button>
            <input id="profile-avatar-input" className="profile-avatar-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatar} aria-label="Upload profile photo"/>
            <div className="profile-photo-actions"><button type="button" onClick={()=>document.getElementById('profile-avatar-input')?.click()} disabled={avatarBusy}><Upload size={14}/>{avatarBusy?'Uploading…':'Edit photo'}</button>{localAvatar&&<button type="button" onClick={removeAvatar} disabled={avatarBusy}>Remove</button>}</div>
          </div>
          <div className="profile-summary-copy"><span className="section-label">EVOLV MEMBER</span><h3>{profileName||'Your name'}.</h3><p>{draft.bio||'Build a life you can recognise as your own.'}</p><small>{user?.email||profile?.email||'Account email'}</small></div>
        </div>
        <button type="button" className="profile-edit-button" onClick={beginEdit}><Pencil size={15}/> Edit profile</button>
        <div className="profile-summary-focus"><span className="section-label">FOCUS</span><strong>{profile?.focus||data?.focus||'Choose your direction'}</strong></div>
        <div className="profile-summary-focus"><span className="section-label">GROWTH AREAS</span><strong>{(profile?.growth_areas||data?.areas||[]).length||0} selected</strong></div>
      </aside>
      <div className="profile-settings-column">
        <section className="profile-stat-grid" aria-label="Your EVOLV statistics"><article><span>STREAK</span><strong>{streaks.current}</strong><small>current days</small></article><article><span>COMPLETED</span><strong>{completed}</strong><small>saved entries</small></article><article><span>BEST STREAK</span><strong>{streaks.best}</strong><small>best run</small></article><article><span>MEMBER SINCE</span><strong>{memberSince}</strong><small>your EVOLV start</small></article></section>
        <ProfileSettingsSection label="ACCOUNT" title="Account">
          <div className="profile-setting-row"><div><strong>Name</strong><span>Your display name across EVOLV.</span></div><button type="button" className="settings-inline-action" onClick={beginEdit}>Edit <ChevronRight size={15}/></button></div>
          <div className="profile-setting-row"><div><strong>Email</strong><span>Managed securely by your EVOLV account.</span></div><button type="button" className="settings-inline-action" onClick={beginEdit}>{user?.email||'Add email'} <ChevronRight size={15}/></button></div>
          <div className="profile-setting-row"><div><strong>Bio</strong><span>A short line shown on your profile.</span></div><button type="button" className="settings-inline-action" onClick={beginEdit}>{draft.bio?'Edit bio':'Add bio'} <ChevronRight size={15}/></button></div>
          <div className="profile-setting-row"><div><strong>Avatar</strong><span>Use a clear image or keep your initials.</span></div><button type="button" className="settings-inline-action" onClick={()=>document.getElementById('profile-avatar-input')?.click()}>Edit photo <ChevronRight size={15}/></button></div>
        </ProfileSettingsSection>
        <ProfileSettingsSection label="GOALS & HABITS" title="Goals and habits">
          <SettingSelect label="Weekly goal target" description="How many focused check-ins you want each week." value={settings.weeklyGoalTarget} onChange={v=>updateSetting('weeklyGoalTarget',Number(v))} options={[1,2,3,4,5,6,7].map(v=>({value:v,label:v+' '+(v===1?'check-in':'check-ins')}))}/>
          <label className="profile-setting-row profile-setting-control-row"><span className="profile-setting-copy"><strong>Default reminder time</strong><small>Used as the starting time for your daily reminder.</small></span><input type="time" value={notificationTimes.morningTime||'08:00'} onChange={e=>saveNotificationTime('morningTime',e)} aria-label="Default reminder time"/></label>
          <SettingSelect label="Week starts" description="Choose how weekly progress is grouped." value={settings.weekStart} onChange={v=>updateSetting('weekStart',v)} options={[{value:'monday',label:'Monday'},{value:'sunday',label:'Sunday'}]}/>
        </ProfileSettingsSection>
        <ProfileSettingsSection label="NOTIFICATIONS" title="Notifications">
          <SettingToggle label="Daily reminders" description="Your existing morning, midday and evening reminders." checked={notificationsEnabled} onChange={toggleNotifications}/>
          <SettingToggle label="Streak alerts" description="Keep a quiet nudge when a streak is at risk." checked={settings.streakAlerts} onChange={v=>updateSetting('streakAlerts',v)}/>
          <SettingToggle label="Weekly summary" description="Keep a weekly view of how consistently you showed up." checked={settings.weeklySummary} onChange={v=>updateSetting('weeklySummary',v)}/>
          <div className="profile-setting-row profile-setting-row-nested"><div><strong>Reminder schedule</strong><span>Existing EVOLV reminder times.</span></div><span className="settings-value">{notificationTimes.morningTime} · {notificationTimes.hydrationTime} · {notificationTimes.reflectionTime}</span></div>
          <div className="profile-setting-row profile-setting-row-nested"><div><strong>Quiet hours</strong><span>EVOLV will not interrupt this window.</span></div><div className="settings-quiet-control"><input type="time" value={notificationTimes.quietStart||'23:00'} onChange={e=>saveQuietHour('quietStart',e)} aria-label="Quiet hours start"/><span>to</span><input type="time" value={notificationTimes.quietEnd||'07:00'} onChange={e=>saveQuietHour('quietEnd',e)} aria-label="Quiet hours end"/><button type="button" className={notificationTimes.quietHours?'settings-toggle active':'settings-toggle'} onClick={toggleQuietHours} aria-pressed={notificationTimes.quietHours} aria-label="Toggle quiet hours"><span/></button></div></div>
        </ProfileSettingsSection>
        <ProfileSettingsSection label="PREFERENCES" title="Preferences">
          <SettingSelect label="Units" description="Default measurement preference for supported metrics." value={settings.units} onChange={v=>updateSetting('units',v)} options={[{value:'metric',label:'Metric'},{value:'imperial',label:'Imperial'}]}/>
          <SettingToggle label="Animations" description="Turn visual motion off for a reduced-motion experience." checked={settings.animations} onChange={v=>updateSetting('animations',v)}/>
          <div className="profile-setting-row"><div><strong>Language</strong><span>Interface language available in this build.</span></div><span className="settings-value">English</span></div>
        </ProfileSettingsSection>
        <ProfileSettingsSection label="DATA & PRIVACY" title="Data and privacy">
          <div className="profile-setting-row"><div><strong>Export my data</strong><span>Download your tracked EVOLV data as JSON.</span></div><button type="button" className="settings-inline-action" onClick={exportData}><Download size={15}/> Export</button></div>
          <div className="profile-setting-row danger-row"><div><strong>Reset all habit data</strong><span>Remove logs, meals, goals and reflections without deleting your account.</span></div><button type="button" className="settings-danger-button" onClick={()=>setConfirmAction('reset')}>Reset data</button></div>
        </ProfileSettingsSection>
        <ProfileSettingsSection label="DANGER ZONE" title="Account actions" danger>
          <div className="profile-setting-row danger-row"><div><strong>Log out</strong><span>Sign out on this device. Your data stays saved.</span></div><button type="button" className="settings-danger-button" onClick={()=>setConfirmAction('logout')}>Log out</button></div>
          <div className="profile-setting-row danger-row"><div><strong>Delete account</strong><span>Permanently remove your account and saved information.</span></div><button type="button" className="settings-danger-button" onClick={()=>setConfirmAction('delete')}>Delete account</button></div>
        </ProfileSettingsSection>
      </div>
    </div>
    {editOpen&&createPortal(<div className="profile-modal-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&cancelEdit()}><section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title"><div className="profile-modal-head"><div><span className="section-label">ACCOUNT</span><h3 id="profile-edit-title">Edit profile.</h3></div><button type="button" onClick={cancelEdit} aria-label="Close edit profile"><X size={18}/></button></div><form onSubmit={saveProfile}><label><span>Name</span><input autoFocus maxLength={80} value={draft.name} onChange={e=>{setDraft({...draft,name:e.target.value});setUnsaved(true)}}/></label><label><span>Email</span><input type="email" maxLength={320} value={draft.email} onChange={e=>{setDraft({...draft,email:e.target.value});setUnsaved(true)}}/></label><label><span>Bio <small>optional</small></span><textarea maxLength={180} rows="3" value={draft.bio} onChange={e=>{setDraft({...draft,bio:e.target.value});setUnsaved(true)}} placeholder="A short line about you."/></label>{error&&<p className="profile-inline-error" role="alert">{error}</p>}<div className="profile-modal-actions"><button type="button" className="settings-cancel-button" onClick={cancelEdit}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving?'Saving…':'Save changes'} <Check size={15}/></button></div></form></section></div>,document.body)}
    {confirmAction&&<div className="profile-modal-backdrop"><section className="profile-modal confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="profile-confirm-title"><div className="confirmation-icon"><Trash2 size={18}/></div><span className="section-label">ARE YOU SURE</span><h3 id="profile-confirm-title">{confirmAction==='reset'?'Reset habit data?':confirmAction==='logout'?'Log out of EVOLV?':'Delete your account?'}</h3><p>{confirmAction==='reset'?'This permanently removes your logs, meals, goals, reflections and notification history. Your account stays intact.':confirmAction==='logout'?'Your data remains saved. You can sign back in whenever you are ready.':'This permanently removes your EVOLV account. This cannot be undone.'}</p><div className="profile-modal-actions"><button type="button" className="settings-cancel-button" onClick={()=>setConfirmAction(null)}>Cancel</button><button type="button" className="settings-danger-button" disabled={resetting||deleting} onClick={()=>{if(confirmAction==='reset')resetHabitData();if(confirmAction==='logout'){setConfirmAction(null);onLogout()};if(confirmAction==='delete'){setConfirmAction(null);deleteAccount()}}}>{resetting||deleting?'Working…':confirmAction==='reset'?'Reset data':confirmAction==='logout'?'Log out':'Delete account'}</button></div></section></div>}
    {toast&&<div className={'profile-toast '+(toastError?'error':'')} role="status" aria-live="polite">{toast}</div>}
  </section>
}
