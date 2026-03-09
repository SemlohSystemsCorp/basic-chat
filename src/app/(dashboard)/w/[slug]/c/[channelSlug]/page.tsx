'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '../../workspace-context';
import { useTheme } from '@/lib/theme-context';
import styles from './channel.module.css';

interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface MessageData {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  attachments: Attachment[];
  user: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface PendingFile {
  file: File;
  preview: string | null;
}

export default function ChannelPage() {
  const router = useRouter();
  const params = useParams();
  const boxSlug = params.slug as string;
  const channelSlug = params.channelSlug as string;

  const { loading: wsLoading, box, channels, members, user, isAdmin, addChannel } = useWorkspace();
  const { theme, toggleTheme } = useTheme();

  const activeChannel = channels.find((c) => c.slug === channelSlug) || null;

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBoxMenu, setShowBoxMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [leavingBox, setLeavingBox] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  // Create channel modal
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [createChannelError, setCreateChannelError] = useState('');

  // Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const boxMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Redirect to first channel if current slug doesn't match any channel
  useEffect(() => {
    if (wsLoading) return;
    if (!activeChannel && channels.length > 0) {
      router.replace(`/w/${boxSlug}/c/${channels[0].slug}`);
    }
  }, [wsLoading, activeChannel, channels, boxSlug, router]);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  // Close box menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxMenuRef.current && !boxMenuRef.current.contains(e.target as Node)) {
        setShowBoxMenu(false);
      }
    }
    if (showBoxMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBoxMenu]);

  async function handleLeaveBox() {
    if (!box || !user) return;

    // If admin/owner, check if there are other admins
    if (user.role === 'owner') {
      const otherAdmins = members.filter(
        (m) => m.user_id !== user.id && (m.role === 'owner' || m.role === 'admin')
      );
      if (otherAdmins.length === 0) {
        const confirmed = window.confirm(
          'You are the only owner/admin. If you leave, no one will be able to manage this workspace. Are you sure?'
        );
        if (!confirmed) return;

        // Transfer ownership to the longest-standing member if any
        const others = members.filter((m) => m.user_id !== user.id);
        if (others.length > 0) {
          await supabase
            .from('box_members')
            .update({ role: 'owner' })
            .eq('box_id', box.id)
            .eq('user_id', others[0].user_id);
        }
      }
    }

    setLeavingBox(true);
    await supabase
      .from('box_members')
      .delete()
      .eq('box_id', box.id)
      .eq('user_id', user.id);

    router.push('/dashboard');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  // Load messages + realtime subscription when active channel changes
  useEffect(() => {
    if (!activeChannel) return;

    loadMessages(activeChannel.id);

    const channel = supabase
      .channel(`messages:${activeChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        async (payload) => {
          const msg = payload.new as { id: string; content: string | null; created_at: string; user_id: string; attachments: Attachment[] };
          const { data: userData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', msg.user_id)
            .single();

          const newMsg: MessageData = {
            ...msg,
            attachments: msg.attachments || [],
            user: userData || { display_name: 'Unknown', avatar_url: null },
          };

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel]);

  async function loadMessages(channelId: string) {
    const { data } = await supabase
      .from('messages')
      .select('id, content, created_at, user_id, attachments, user:profiles(display_name, avatar_url)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data.map((m: Record<string, unknown>) => ({
        ...m,
        attachments: (m.attachments as Attachment[]) || [],
      })) as unknown as MessageData[]);
    }
  }

  async function uploadFiles(files: PendingFile[]): Promise<Attachment[]> {
    const attachments: Attachment[] = [];

    for (const pf of files) {
      const ext = pf.file.name.split('.').pop() || '';
      const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from('attachments')
        .upload(path, pf.file);

      if (error) continue;

      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(path);

      attachments.push({
        url: urlData.publicUrl,
        name: pf.file.name,
        type: pf.file.type,
        size: pf.file.size,
      });
    }

    return attachments;
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const content = newMessage.trim();
    if ((!content && pendingFiles.length === 0) || !activeChannel || !user) return;

    setSending(true);
    setNewMessage('');

    let attachments: Attachment[] = [];
    if (pendingFiles.length > 0) {
      attachments = await uploadFiles(pendingFiles);
      // Clean up previews
      pendingFiles.forEach((pf) => {
        if (pf.preview) URL.revokeObjectURL(pf.preview);
      });
      setPendingFiles([]);
    }

    await supabase
      .from('messages')
      .insert({
        channel_id: activeChannel.id,
        user_id: user.id,
        content: content || null,
        attachments: attachments.length > 0 ? attachments : [],
      });

    setSending(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFilesSelected(files: FileList | null) {
    if (!files) return;
    const newPending: PendingFile[] = Array.from(files).map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!box) return;
    setCreateChannelError('');
    setCreatingChannel(true);

    const res = await fetch('/api/channels/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newChannelName,
        description: newChannelDesc,
        boxId: box.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setCreateChannelError(data.error || 'Failed to create channel');
      setCreatingChannel(false);
      return;
    }

    addChannel(data.channel);
    setShowCreateChannel(false);
    setNewChannelName('');
    setNewChannelDesc('');
    setCreatingChannel(false);
    router.push(`/w/${boxSlug}/c/${data.channel.slug}`);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!box) return;
    setInviteError('');
    setInviteSuccess('');
    setInviting(true);

    const res = await fetch('/api/invites/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), boxId: box.id }),
    });

    const data = await res.json();

    if (!res.ok) {
      setInviteError(data.error || 'Failed to send invite');
      setInviting(false);
      return;
    }

    setInviteSuccess(`Invite sent to ${inviteEmail.trim()}`);
    setInviteEmail('');
    setInviting(false);
  }

  function copyInviteCode() {
    if (!box) return;
    navigator.clipboard.writeText(box.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function formatDateDivider(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  }

  function isDifferentDay(a: string, b: string) {
    return new Date(a).toDateString() !== new Date(b).toDateString();
  }

  // Group messages Discord-style: consecutive messages by same user within 5 minutes
  function shouldShowHeader(msg: MessageData, prevMsg: MessageData | null): boolean {
    if (!prevMsg) return true;
    if (msg.user_id !== prevMsg.user_id) return true;
    const diff = new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
    return diff > 5 * 60 * 1000;
  }

  function isImageType(type: string) {
    return type.startsWith('image/');
  }

  function isVideoType(type: string) {
    return type.startsWith('video/');
  }

  function renderAttachments(attachments: Attachment[]) {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className={styles.messageAttachments}>
        {attachments.map((att, i) => {
          if (isImageType(att.type)) {
            return (
              <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={att.url} alt={att.name} className={styles.messageImage} />
              </a>
            );
          }
          if (isVideoType(att.type)) {
            return (
              <video key={i} src={att.url} controls className={styles.messageVideo} />
            );
          }
          return (
            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className={styles.messageFile}>
              <svg className={styles.messageFileIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className={styles.messageFileName}>{att.name}</span>
              <span className={styles.messageFileSize}>{formatFileSize(att.size)}</span>
            </a>
          );
        })}
      </div>
    );
  }

  // Video call state
  const [activeCall, setActiveCall] = useState<{ id: string; call_code: string; room_url: string; title: string | null } | null>(null);
  const [callView, setCallView] = useState<'chat' | 'call'>('chat'); // which view is shown in main area
  const [creatingCall, setCreatingCall] = useState(false);
  const [showInviteCall, setShowInviteCall] = useState(false);
  const [callInvitesSent, setCallInvitesSent] = useState(false);
  const [callCodeCopied, setCallCodeCopied] = useState(false);
  const [channelCalls, setChannelCalls] = useState<{ id: string; call_code: string; room_url: string; title: string | null; status: string; started_at: string; created_by: string }[]>([]);

  // Load active calls for this channel
  useEffect(() => {
    if (!activeChannel || !box) return;
    async function loadCalls() {
      const { data } = await supabase
        .from('calls')
        .select('id, call_code, room_url, title, status, started_at, created_by')
        .eq('box_id', box!.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(10);
      if (data) setChannelCalls(data);
    }
    loadCalls();
  }, [activeChannel, box]);

  async function handleStartCall() {
    if (!box || !activeChannel || creatingCall) return;
    setCreatingCall(true);
    const res = await fetch('/api/calls/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boxId: box.id,
        channelId: activeChannel.id,
        title: `#${activeChannel.name} call`,
      }),
    });
    const data = await res.json();
    setCreatingCall(false);
    if (res.ok && data.call) {
      setActiveCall(data.call);
      setCallView('call');
      setChannelCalls((prev) => [data.call, ...prev]);
    }
  }

  async function handleJoinCall(call: { id: string; call_code: string; room_url: string; title: string | null }) {
    const res = await fetch('/api/calls/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callCode: call.call_code }),
    });
    if (res.ok) {
      setActiveCall(call);
      setCallView('call');
    }
  }

  async function handleEndCall() {
    if (!activeCall) return;
    await fetch('/api/calls/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId: activeCall.id }),
    });
    setChannelCalls((prev) => prev.filter((c) => c.id !== activeCall.id));
    setActiveCall(null);
    setCallView('chat');
    setShowInviteCall(false);
  }

  function handleLeaveCall() {
    setActiveCall(null);
    setCallView('chat');
    setShowInviteCall(false);
  }

  async function handleInviteToCall(userIds: string[]) {
    if (!activeCall) return;
    await fetch('/api/calls/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId: activeCall.id, userIds }),
    });
    setCallInvitesSent(true);
    setTimeout(() => setCallInvitesSent(false), 2000);
  }

  function copyCallCode() {
    if (!activeCall) return;
    navigator.clipboard.writeText(activeCall.call_code);
    setCallCodeCopied(true);
    setTimeout(() => setCallCodeCopied(false), 2000);
  }

  // Filter DM members: all workspace members except current user
  const dmMembers = members.filter((m) => m.user_id !== user?.id);

  if (wsLoading) {
    return (
      <div className={styles.loadingPage}>
        <div className="spinner" />
      </div>
    );
  }

  if (!box || !user) return null;

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader} ref={boxMenuRef}>
          <div className={styles.boxNameRow} onClick={() => setShowBoxMenu(!showBoxMenu)} style={{ cursor: 'pointer' }}>
            <div className={styles.boxIcon}>
              {box.name.charAt(0).toUpperCase()}
            </div>
            <span className={styles.boxName}>{box.name}</span>
            <svg className={styles.boxChevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {showBoxMenu && (
            <div className={styles.boxPopover}>
              <button className={styles.popoverItem} onClick={() => { setShowBoxMenu(false); router.push(`/w/${box?.slug}/settings`); }}>
                <span className={styles.popoverIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </span>
                Workspace settings
              </button>
              <button className={styles.popoverItem} onClick={() => { setShowBoxMenu(false); setShowInviteModal(true); }}>
                <span className={styles.popoverIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </span>
                Invite people
              </button>
              <div className={styles.popoverDivider} />
              <button className={`${styles.popoverItem} ${styles.popoverItemDanger}`} onClick={() => { setShowBoxMenu(false); handleLeaveBox(); }} disabled={leavingBox}>
                <span className={styles.popoverIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </span>
                {leavingBox ? 'Leaving...' : 'Leave workspace'}
              </button>
            </div>
          )}
        </div>

        <div className={styles.sidebarSection}>
          <div className={styles.sidebarLabelRow}>
            <span className={styles.sidebarLabel}>Channels</span>
            {isAdmin && (
              <button
                className={styles.addChannelBtn}
                onClick={() => setShowCreateChannel(true)}
                title="Create channel"
              >
                +
              </button>
            )}
          </div>
          <div className={styles.channelList}>
            {channels.map((ch) => (
              <Link
                key={ch.id}
                href={`/w/${boxSlug}/c/${ch.slug}`}
                className={`${styles.channelItem} ${activeChannel?.id === ch.id ? styles.channelItemActive : ''}`}
              >
                <span className={styles.channelHash}>#</span>
                {ch.name}
              </Link>
            ))}
            {isAdmin && (
              <button
                className={styles.addChannelLink}
                onClick={() => setShowCreateChannel(true)}
              >
                <span className={styles.addChannelPlus}>+</span>
                Add channels
              </button>
            )}
          </div>

          {/* Direct Messages */}
          {/* Active Calls */}
          {channelCalls.length > 0 && (
            <>
              <div className={styles.sidebarLabelRow} style={{ marginTop: 16 }}>
                <span className={styles.sidebarLabel}>Calls</span>
              </div>
              <div className={styles.channelList}>
                {channelCalls.map((c) => (
                  <button
                    key={c.id}
                    className={`${styles.channelItem} ${activeCall?.id === c.id ? styles.channelItemActive : ''}`}
                    onClick={() => handleJoinCall(c)}
                  >
                    <span className={styles.channelHash}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || 'Call'}</span>
                    <span className={styles.callLiveBadge}>Live</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className={styles.sidebarLabelRow} style={{ marginTop: 16 }}>
            <span className={styles.sidebarLabel}>Direct messages</span>
          </div>
          <div className={styles.channelList}>
            {dmMembers.map((m) => (
              <Link
                key={m.user_id}
                href={`/w/${boxSlug}/dm/${m.user_id}`}
                className={styles.channelItem}
              >
                <div className={styles.dmAvatar}>{m.user?.display_name?.charAt(0)?.toUpperCase() || '?'}</div>
                {m.user?.display_name}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.sidebarFooter} ref={userMenuRef}>
          {showUserMenu && (
            <div className={styles.userPopover}>
              <Link href="/dashboard" className={styles.popoverItem} onClick={() => setShowUserMenu(false)}>
                <span className={styles.popoverIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </span>
                Dashboard
              </Link>
              <button className={styles.popoverItem} onClick={() => { setShowSettings(true); setShowUserMenu(false); }}>
                <span className={styles.popoverIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </span>
                Settings
              </button>
              <button className={styles.popoverItem} onClick={() => { toggleTheme(); setShowUserMenu(false); }}>
                <span className={styles.popoverIcon}>
                  {theme === 'light' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  )}
                </span>
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </button>
              <div className={styles.popoverDivider} />
              <button className={`${styles.popoverItem} ${styles.popoverItemDanger}`} onClick={handleSignOut}>
                <span className={styles.popoverIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </span>
                Sign out
              </button>
            </div>
          )}
          <div className={styles.userBar} onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className={styles.userAvatar}>
              {user.displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.displayName}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
            <span className={styles.userMenuDots}>···</span>
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className={styles.main}>
        {activeChannel ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <span className={styles.chatChannelName}># {activeChannel.name}</span>
                {activeChannel.description && (
                  <>
                    <span className={styles.chatHeaderDivider} />
                    <span className={styles.chatChannelDesc}>{activeChannel.description}</span>
                  </>
                )}
              </div>
              <div className={styles.chatHeaderRight}>
                <span className={styles.memberCount}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {members.length}
                </span>
                <button
                  className={styles.headerActionBtn}
                  onClick={() => {
                    if (activeCall) {
                      setCallView(callView === 'call' ? 'chat' : 'call');
                    } else {
                      handleStartCall();
                    }
                  }}
                  title={activeCall ? (callView === 'call' ? 'Back to chat' : 'Show call') : 'Start a call'}
                  disabled={creatingCall}
                >
                  {activeCall ? (
                    callView === 'call' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    )
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  )}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  Settings
                </button>
              </div>
            </div>

            {/* Active call banner when viewing chat */}
            {activeCall && callView === 'chat' && (
              <div className={styles.callBanner}>
                <div className={styles.callBannerLeft}>
                  <div className={styles.callBannerPulse} />
                  <span className={styles.callBannerText}>{activeCall.title || 'Call in progress'}</span>
                  <code className={styles.callCode}>{activeCall.call_code}</code>
                </div>
                <div className={styles.callBannerActions}>
                  <button className="btn btn-primary btn-sm" onClick={() => setCallView('call')}>
                    Rejoin
                  </button>
                  <button className={`btn btn-sm ${styles.endCallBtnSmall}`} onClick={handleLeaveCall}>
                    Leave
                  </button>
                </div>
              </div>
            )}

            {/* Call View */}
            {callView === 'call' && activeCall ? (
              <div className={styles.callViewContainer}>
                {/* Call header */}
                <div className={styles.callHeaderBar}>
                  <div className={styles.callHeaderLeft}>
                    <span className={styles.callHeaderTitle}>{activeCall.title || 'Video Call'}</span>
                    <div className={styles.callCodeGroup}>
                      <code className={styles.callCode}>{activeCall.call_code}</code>
                      <button
                        className={styles.callCodeCopyBtn}
                        onClick={copyCallCode}
                        title="Copy call code"
                      >
                        {callCodeCopied ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className={styles.callHeaderRight}>
                    <button
                      className={styles.headerActionBtn}
                      onClick={() => setShowInviteCall(!showInviteCall)}
                      title="Invite members"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    </button>
                    <button
                      className={styles.headerActionBtn}
                      onClick={() => setCallView('chat')}
                      title="Back to chat"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </button>
                    <button
                      className={`${styles.headerActionBtn} ${styles.endCallBtn}`}
                      onClick={handleEndCall}
                      title="End call for everyone"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
                    </button>
                    <button
                      className={styles.callLeaveBtn}
                      onClick={handleLeaveCall}
                    >
                      Leave
                    </button>
                  </div>
                </div>

                {/* Invite bar */}
                {showInviteCall && (
                  <div className={styles.callInviteBar}>
                    <span className={styles.callInviteLabel}>Invite:</span>
                    <div className={styles.callInviteList}>
                      {members.filter((m) => m.user_id !== user?.id).map((m) => (
                        <button
                          key={m.user_id}
                          className={styles.callInviteUser}
                          onClick={() => handleInviteToCall([m.user_id])}
                        >
                          <div className={styles.dmAvatar}>{m.user?.display_name?.charAt(0)?.toUpperCase() || '?'}</div>
                          {m.user?.display_name}
                        </button>
                      ))}
                    </div>
                    {callInvitesSent && <span className={styles.callInviteSent}>Invite sent!</span>}
                  </div>
                )}

                {/* Call content - Daily.co iframe */}
                <div className={styles.callContent}>
                  {activeCall.room_url ? (
                    <iframe
                      className={styles.callFrame}
                      src={activeCall.room_url}
                      allow="camera; microphone; fullscreen; display-capture"
                    />
                  ) : (
                    <div className={styles.callPlaceholder}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                      <p>Call started</p>
                      <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Share the code <code className={styles.callCode}>{activeCall.call_code}</code> to invite others</p>
                    </div>
                  )}
                </div>

                {/* Call bottom bar */}
                <div className={styles.callBottomBar}>
                  <div className={styles.callBottomCenter}>
                    <button className={styles.callControlBtn} title="Share call link" onClick={copyCallCode}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    </button>
                    <button className={styles.callControlBtn} title="Invite members" onClick={() => setShowInviteCall(!showInviteCall)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    </button>
                    <button className={styles.callEndBtn} title="End call" onClick={handleEndCall}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
            <>
            {/* Messages — Discord style */}
            {messages.length === 0 ? (
              <div className={styles.emptyMessages}>
                <div className={styles.emptyTitle}># {activeChannel.name}</div>
                <p className={styles.emptyDesc}>
                  This is the start of the #{activeChannel.name} channel. Send a message to get the conversation going.
                </p>
              </div>
            ) : (
              <div className={styles.messages}>
                {messages.map((msg, i) => {
                  const prev = i > 0 ? messages[i - 1] : null;
                  const showHeader = shouldShowHeader(msg, prev);
                  const showDateDivider = !prev || isDifferentDay(prev.created_at, msg.created_at);

                  return (
                    <div key={msg.id}>
                      {showDateDivider && (
                        <div className={styles.dateDivider}>
                          <span className={styles.dateDividerText}>{formatDateDivider(msg.created_at)}</span>
                        </div>
                      )}
                      {showHeader ? (
                        <div className={styles.messageGroup}>
                          <div className={styles.messageAvatar}>
                            {msg.user?.display_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className={styles.messageContent}>
                            <div className={styles.messageHeader}>
                              <span className={styles.messageName}>{msg.user?.display_name}</span>
                              <span className={styles.messageTime}>{formatTime(msg.created_at)}</span>
                            </div>
                            {msg.content && <div className={styles.messageText}><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>}
                            {renderAttachments(msg.attachments)}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.messageContinuation}>
                          {msg.content && <div className={styles.messageText}><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>}
                          {renderAttachments(msg.attachments)}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Message Input */}
            <div className={styles.inputArea}>
              <div className={styles.inputBox}>
                {/* Attachment previews */}
                {pendingFiles.length > 0 && (
                  <div className={styles.attachmentPreviews}>
                    {pendingFiles.map((pf, i) => (
                      <div key={i} className={styles.attachmentPreview}>
                        {pf.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pf.preview} alt={pf.file.name} className={styles.attachmentPreviewImage} />
                        ) : (
                          <div className={styles.attachmentPreviewFile}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span className={styles.attachmentPreviewFileName}>{pf.file.name}</span>
                            <span className={styles.attachmentPreviewSize}>{formatFileSize(pf.file.size)}</span>
                          </div>
                        )}
                        <button className={styles.attachmentRemoveBtn} onClick={() => removePendingFile(i)}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formatting toolbar */}
                <div className={styles.formatToolbar}>
                  <button type="button" className={styles.formatBtn} title="Bold"><strong>B</strong></button>
                  <button type="button" className={styles.formatBtn} title="Italic"><em>I</em></button>
                  <button type="button" className={styles.formatBtn} title="Underline" style={{ textDecoration: 'underline' }}>U</button>
                  <button type="button" className={styles.formatBtn} title="Strikethrough" style={{ textDecoration: 'line-through' }}>S</button>
                  <div className={styles.formatDivider} />
                  <button type="button" className={styles.formatBtn} title="Link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  </button>
                  <div className={styles.formatDivider} />
                  <button type="button" className={styles.formatBtn} title="Ordered list">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
                  </button>
                  <button type="button" className={styles.formatBtn} title="Bulleted list">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
                  </button>
                  <div className={styles.formatDivider} />
                  <button type="button" className={styles.formatBtn} title="Code">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  </button>
                  <button type="button" className={styles.formatBtn} title="Code block">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><polyline points="8 7 12 11 8 15"/><line x1="14" y1="15" x2="18" y2="15"/></svg>
                  </button>
                </div>

                <div className={styles.inputTop}>
                  <textarea
                    ref={textareaRef}
                    className={styles.messageInput}
                    placeholder={`Message #${activeChannel.name}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                </div>

                <div className={styles.inputBottom}>
                  <div className={styles.inputActions}>
                    {/* Plus / attach */}
                    <button
                      type="button"
                      className={styles.inputActionBtn}
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach file"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      hidden
                      onChange={(e) => handleFilesSelected(e.target.files)}
                    />

                    <div className={styles.inputActionDivider} />

                    {/* Image/Video upload */}
                    <button
                      type="button"
                      className={styles.inputActionBtn}
                      onClick={() => imageInputRef.current?.click()}
                      title="Upload image or video"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      hidden
                      onChange={(e) => handleFilesSelected(e.target.files)}
                    />

                    {/* Emoji placeholder */}
                    <button type="button" className={styles.inputActionBtn} title="Emoji">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                      </svg>
                    </button>

                    {/* Mention placeholder */}
                    <button type="button" className={styles.inputActionBtn} title="Mention someone">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
                      </svg>
                    </button>
                  </div>

                  <button
                    type="button"
                    className={styles.sendBtn}
                    disabled={(!newMessage.trim() && pendingFiles.length === 0) || sending}
                    onClick={() => handleSend()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
          )}
          </>
        ) : (
          <div className={styles.emptyMessages}>
            <p className={styles.emptyDesc}>No channels yet.</p>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={styles.settingsPanel}>
          <div className={styles.settingsHeader}>
            <span className={styles.settingsTitle}>{box.name}</span>
            <button className={styles.closeBtn} onClick={() => setShowSettings(false)}>&times;</button>
          </div>
          <div className={styles.settingsBody}>
            <div className={styles.settingsSection}>
              <div className={styles.settingsSectionTitle}>Invite Code</div>
              <div className={styles.inviteCodeBox}>
                <code className={styles.inviteCode}>{box.invite_code}</code>
                <button className="btn btn-secondary btn-sm" onClick={copyInviteCode}>
                  {codeCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className={styles.hint}>Share this code to invite people.</p>
            </div>

            {isAdmin && (
              <div className={styles.settingsSection}>
                <div className={styles.settingsSectionTitle}>Invite by Email</div>
                <form onSubmit={handleInvite} className={styles.inviteForm}>
                  <input
                    type="email"
                    className="input"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={inviting}
                  >
                    {inviting ? '...' : 'Send'}
                  </button>
                </form>
                {inviteError && <p className={styles.errorText}>{inviteError}</p>}
                {inviteSuccess && <p className={styles.successText}>{inviteSuccess}</p>}
              </div>
            )}

            <div className={styles.settingsSection}>
              <div className={styles.settingsSectionTitle}>Members ({members.length})</div>
              <div className={styles.memberList}>
                {members.map((member) => (
                  <div key={member.id} className={styles.memberItem}>
                    <div className="avatar avatar-sm">
                      {member.user?.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>{member.user?.display_name}</div>
                      <div className={styles.memberRole}>{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateChannel(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Create a channel</h2>
            <form onSubmit={handleCreateChannel}>
              <div className="field">
                <label className="label" htmlFor="channelName">Channel name</label>
                <input
                  id="channelName"
                  type="text"
                  className="input"
                  placeholder="e.g. announcements"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="channelDesc">Description (optional)</label>
                <input
                  id="channelDesc"
                  type="text"
                  className="input"
                  placeholder="What is this channel about?"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                />
              </div>
              {createChannelError && (
                <div className="alert alert-error">{createChannelError}</div>
              )}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateChannel(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingChannel || !newChannelName.trim()}
                >
                  {creatingChannel ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && box && (
        <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Invite people</h2>

            <div style={{ marginBottom: 16 }}>
              <div className={styles.inviteModalLabel}>Share invite code</div>
              <div className={styles.inviteCodeBox}>
                <code className={styles.inviteCode}>{box.invite_code}</code>
                <button className="btn btn-secondary btn-sm" onClick={copyInviteCode}>
                  {codeCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className={styles.hint}>Anyone with this code can join this workspace.</p>
            </div>

            {isAdmin && (
              <div>
                <div className={styles.inviteModalLabel}>Invite by email</div>
                <form onSubmit={handleInvite} className={styles.inviteForm}>
                  <input
                    type="email"
                    className="input"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={inviting}>
                    {inviting ? '...' : 'Send'}
                  </button>
                </form>
                {inviteError && <p className={styles.errorText}>{inviteError}</p>}
                {inviteSuccess && <p className={styles.successText}>{inviteSuccess}</p>}
              </div>
            )}

            <div className={styles.modalActions}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
