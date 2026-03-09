'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '../../workspace-context';
import { useTheme } from '@/lib/theme-context';
import styles from '../../c/[channelSlug]/channel.module.css';

interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface DmMessage {
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

export default function DmPage() {
  const router = useRouter();
  const params = useParams();
  const boxSlug = params.slug as string;
  const recipientId = params.recipientId as string;
  const { theme, toggleTheme } = useTheme();

  const { loading: wsLoading, box, channels, members, user, isAdmin, addChannel } = useWorkspace();

  const recipient = members.find((m) => m.user_id === recipientId);

  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
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
    if (user.role === 'owner') {
      const otherAdmins = members.filter(
        (m) => m.user_id !== user.id && (m.role === 'owner' || m.role === 'admin')
      );
      if (otherAdmins.length === 0) {
        const confirmed = window.confirm(
          'You are the only owner/admin. If you leave, no one will be able to manage this workspace. Are you sure?'
        );
        if (!confirmed) return;
        const others = members.filter((m) => m.user_id !== user.id);
        if (others.length > 0) {
          await supabase.from('box_members').update({ role: 'owner' }).eq('box_id', box.id).eq('user_id', others[0].user_id);
        }
      }
    }
    setLeavingBox(true);
    await supabase.from('box_members').delete().eq('box_id', box.id).eq('user_id', user.id);
    router.push('/dashboard');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  // Load or create DM conversation + messages + realtime
  useEffect(() => {
    if (!user || !box || !recipientId) return;

    async function initDm() {
      // Ensure user1_id < user2_id for the unique constraint
      const [u1, u2] = [user!.id, recipientId].sort();

      // Try to find existing conversation
      let { data: conv } = await supabase
        .from('dm_conversations')
        .select('id')
        .eq('box_id', box!.id)
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .single();

      if (!conv) {
        // Create new conversation
        const { data: newConv } = await supabase
          .from('dm_conversations')
          .insert({ box_id: box!.id, user1_id: u1, user2_id: u2 })
          .select('id')
          .single();
        conv = newConv;
      }

      if (!conv) return;
      setConversationId(conv.id);

      // Load messages
      const { data: msgData } = await supabase
        .from('dm_messages')
        .select('id, content, created_at, user_id, attachments, user:profiles(display_name, avatar_url)')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (msgData) {
        setMessages(msgData.map((m: Record<string, unknown>) => ({
          ...m,
          attachments: (m.attachments as Attachment[]) || [],
        })) as unknown as DmMessage[]);
      }

      // Realtime subscription
      const channel = supabase
        .channel(`dm:${conv.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'dm_messages',
            filter: `conversation_id=eq.${conv.id}`,
          },
          async (payload) => {
            const msg = payload.new as { id: string; content: string | null; created_at: string; user_id: string; attachments: Attachment[] };
            const { data: userData } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('id', msg.user_id)
              .single();

            const newMsg: DmMessage = {
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
    }

    const cleanup = initDm();
    return () => { cleanup.then((fn) => fn?.()); };
  }, [user, box, recipientId]);

  async function uploadFiles(files: PendingFile[]): Promise<Attachment[]> {
    const attachments: Attachment[] = [];
    for (const pf of files) {
      const ext = pf.file.name.split('.').pop() || '';
      const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('attachments').upload(path, pf.file);
      if (error) continue;
      const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);
      attachments.push({ url: urlData.publicUrl, name: pf.file.name, type: pf.file.type, size: pf.file.size });
    }
    return attachments;
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const content = newMessage.trim();
    if ((!content && pendingFiles.length === 0) || !conversationId || !user) return;

    setSending(true);
    setNewMessage('');

    let attachments: Attachment[] = [];
    if (pendingFiles.length > 0) {
      attachments = await uploadFiles(pendingFiles);
      pendingFiles.forEach((pf) => { if (pf.preview) URL.revokeObjectURL(pf.preview); });
      setPendingFiles([]);
    }

    await supabase.from('dm_messages').insert({
      conversation_id: conversationId,
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
      body: JSON.stringify({ name: newChannelName, description: newChannelDesc, boxId: box.id }),
    });
    const data = await res.json();
    if (!res.ok) { setCreateChannelError(data.error || 'Failed to create channel'); setCreatingChannel(false); return; }
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
    if (!res.ok) { setInviteError(data.error || 'Failed to send invite'); setInviting(false); return; }
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
    if (isToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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

  function shouldShowHeader(msg: DmMessage, prevMsg: DmMessage | null, index: number): boolean {
    if (!prevMsg) return true;
    if (msg.user_id !== prevMsg.user_id) return true;
    const diff = new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
    if (diff > 5 * 60 * 1000) return true;
    // Show avatar every 20 consecutive messages from the same user
    let consecutive = 0;
    for (let j = index - 1; j >= 0; j--) {
      if (messages[j].user_id !== msg.user_id) break;
      consecutive++;
    }
    return consecutive > 0 && consecutive % 20 === 0;
  }

  function isImageType(type: string) { return type.startsWith('image/'); }
  function isVideoType(type: string) { return type.startsWith('video/'); }

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
            return <video key={i} src={att.url} controls className={styles.messageVideo} />;
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

  // Filter DM members: all workspace members except current user
  const dmMembers = members.filter((m) => m.user_id !== user?.id);

  if (wsLoading) {
    return <div className={styles.loadingPage}><div className="spinner" /></div>;
  }

  if (!box || !user) return null;

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader} ref={boxMenuRef}>
          <div className={styles.boxNameRow} onClick={() => setShowBoxMenu(!showBoxMenu)} style={{ cursor: 'pointer' }}>
            <div className={styles.boxIcon}>{box.name.charAt(0).toUpperCase()}</div>
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
              <button className={styles.addChannelBtn} onClick={() => setShowCreateChannel(true)} title="Create channel">+</button>
            )}
          </div>
          <div className={styles.channelList}>
            {channels.map((ch) => (
              <Link key={ch.id} href={`/w/${boxSlug}/c/${ch.slug}`} className={styles.channelItem}>
                <span className={styles.channelHash}>#</span>
                {ch.name}
              </Link>
            ))}
            {isAdmin && (
              <button className={styles.addChannelLink} onClick={() => setShowCreateChannel(true)}>
                <span className={styles.addChannelPlus}>+</span>
                Add channels
              </button>
            )}
          </div>

          {/* Direct Messages */}
          <div className={styles.sidebarLabelRow} style={{ marginTop: 16 }}>
            <span className={styles.sidebarLabel}>Direct messages</span>
          </div>
          <div className={styles.channelList}>
            {dmMembers.map((m) => (
              <Link
                key={m.user_id}
                href={`/w/${boxSlug}/dm/${m.user_id}`}
                className={`${styles.channelItem} ${recipientId === m.user_id ? styles.channelItemActive : ''}`}
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
            <div className={styles.userAvatar}>{user.displayName?.charAt(0)?.toUpperCase() || '?'}</div>
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
        {recipient ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <div className={styles.dmHeaderAvatar}>{recipient.user?.display_name?.charAt(0)?.toUpperCase() || '?'}</div>
                <span className={styles.chatChannelName}>{recipient.user?.display_name}</span>
              </div>
              <div className={styles.chatHeaderRight}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(!showSettings)}>Settings</button>
              </div>
            </div>

            {messages.length === 0 ? (
              <div className={styles.emptyMessages}>
                <div className={styles.emptyTitle}>{recipient.user?.display_name}</div>
                <p className={styles.emptyDesc}>This is the start of your conversation with {recipient.user?.display_name}.</p>
              </div>
            ) : (
              <div className={styles.messages}>
                {messages.map((msg, i) => {
                  const prev = i > 0 ? messages[i - 1] : null;
                  const showHeader = shouldShowHeader(msg, prev, i);
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
                          <div className={styles.messageAvatar}>{msg.user?.display_name?.charAt(0)?.toUpperCase() || '?'}</div>
                          <div className={styles.messageContent}>
                            <div className={styles.messageHeader}>
                              <span className={styles.messageName}>{msg.user?.display_name}</span>
                              <span className={styles.messageTime}>{formatTime(msg.created_at)}</span>
                            </div>
                            {msg.content && (
                              <div className={styles.messageText}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                              </div>
                            )}
                            {renderAttachments(msg.attachments)}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.messageContinuation}>
                          {msg.content && (
                            <div className={styles.messageText}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            </div>
                          )}
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

                <div className={styles.formatToolbar}>
                  <button type="button" className={styles.formatBtn} title="Bold"><strong>B</strong></button>
                  <button type="button" className={styles.formatBtn} title="Italic"><em>I</em></button>
                  <button type="button" className={styles.formatBtn} title="Strikethrough" style={{ textDecoration: 'line-through' }}>S</button>
                  <div className={styles.formatDivider} />
                  <button type="button" className={styles.formatBtn} title="Code">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  </button>
                </div>

                <div className={styles.inputTop}>
                  <textarea
                    ref={textareaRef}
                    className={styles.messageInput}
                    placeholder={`Message ${recipient?.user?.display_name || ''}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                </div>

                <div className={styles.inputBottom}>
                  <div className={styles.inputActions}>
                    <button type="button" className={styles.inputActionBtn} onClick={() => fileInputRef.current?.click()} title="Attach file">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => handleFilesSelected(e.target.files)} />
                    <div className={styles.inputActionDivider} />
                    <button type="button" className={styles.inputActionBtn} onClick={() => imageInputRef.current?.click()} title="Upload image or video">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </button>
                    <input ref={imageInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => handleFilesSelected(e.target.files)} />
                    <button type="button" className={styles.inputActionBtn} title="Emoji">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                    </button>
                  </div>
                  <button type="button" className={styles.sendBtn} disabled={(!newMessage.trim() && pendingFiles.length === 0) || sending} onClick={() => handleSend()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyMessages}>
            <p className={styles.emptyDesc}>User not found.</p>
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
                <button className="btn btn-secondary btn-sm" onClick={copyInviteCode}>{codeCopied ? 'Copied!' : 'Copy'}</button>
              </div>
              <p className={styles.hint}>Share this code to invite people.</p>
            </div>
            {isAdmin && (
              <div className={styles.settingsSection}>
                <div className={styles.settingsSectionTitle}>Invite by Email</div>
                <form onSubmit={handleInvite} className={styles.inviteForm}>
                  <input type="email" className="input" placeholder="email@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={inviting}>{inviting ? '...' : 'Send'}</button>
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
                    <div className="avatar avatar-sm">{member.user?.display_name?.charAt(0)?.toUpperCase() || '?'}</div>
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
                <input id="channelName" type="text" className="input" placeholder="e.g. announcements" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} required autoFocus />
              </div>
              <div className="field">
                <label className="label" htmlFor="channelDesc">Description (optional)</label>
                <input id="channelDesc" type="text" className="input" placeholder="What is this channel about?" value={newChannelDesc} onChange={(e) => setNewChannelDesc(e.target.value)} />
              </div>
              {createChannelError && <div className="alert alert-error">{createChannelError}</div>}
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateChannel(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingChannel || !newChannelName.trim()}>{creatingChannel ? 'Creating...' : 'Create Channel'}</button>
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
