import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatedAvatar } from '../App';
import { format } from 'date-fns';

const safeFormat = (dateValue: any, formatStr: string): string => {
  if (!dateValue) return '';
  let d: Date;
  if (typeof dateValue.toDate === 'function') {
    d = dateValue.toDate();
  } else if (dateValue instanceof Date) {
    d = dateValue;
  } else if (typeof dateValue === 'number' || typeof dateValue === 'string') {
    d = new Date(dateValue);
  } else if (dateValue.seconds !== undefined && dateValue.nanoseconds !== undefined) {
    d = new Date(dateValue.seconds * 1000);
  } else {
    return '';
  }
  
  if (isNaN(d.getTime())) {
    return '';
  }
  
  try {
    return format(d, formatStr);
  } catch (err) {
    console.error("Error formatting date:", err);
    return '';
  }
};

interface CommunitySectionProps {
  communityTab: 'chat' | 'messages' | 'friends' | 'leagues';
  setCommunityTab: (val: 'chat' | 'messages' | 'friends' | 'leagues') => void;
  communityMessages: any[];
  communitySearchQuery: string;
  setCommunitySearchQuery: (val: string) => void;
  user: any;
  fetchUserProfile: (uid: string) => void;
  selectedMessageId: string | null;
  setSelectedMessageId: (val: string | null) => void;
  handleUserClick: (uid: string, name: string, photoURL: string) => void;
  setReportingMessage: (msg: any) => void;
  handleShare: (title: string, desc: string) => void;
  startPrivateChat: (participant: { uid: string; displayName: string; photoURL: string }) => void;
  communityInput: string;
  setCommunityInput: (val: string) => void;
  sendCommunityMessage: () => void;
  friendRequests: any[];
  acceptFriendRequest: (id: string) => void;
  removeFriend: (id: string) => void;
  friends: any[];
  privateChats: any[];
  privateMessages: any[];
  privateInput: string;
  setPrivateInput: (val: string) => void;
  sendPrivateMessage: () => void;
  activeChat: any;
  setActiveChat: (chat: any) => void;
  userSearchQuery: string;
  setUserSearchQuery: (val: string) => void;
  userSearchResults: any[];
  isSearchingUsers: boolean;
  searchUsers: (query: string) => void;
  communityGoal: any;
  leaderboard: any[];
}

export const CommunitySection: React.FC<CommunitySectionProps> = ({
  communityTab,
  setCommunityTab,
  communityMessages,
  communitySearchQuery,
  setCommunitySearchQuery,
  user,
  fetchUserProfile,
  selectedMessageId,
  setSelectedMessageId,
  handleUserClick,
  setReportingMessage,
  handleShare,
  startPrivateChat,
  communityInput,
  setCommunityInput,
  sendCommunityMessage,
  friendRequests,
  acceptFriendRequest,
  removeFriend,
  friends,
  privateChats,
  privateMessages,
  privateInput,
  setPrivateInput,
  sendPrivateMessage,
  activeChat,
  setActiveChat,
  userSearchQuery,
  setUserSearchQuery,
  userSearchResults,
  isSearchingUsers,
  searchUsers,
  communityGoal,
  leaderboard,
}) => {
  return (
    <motion.div 
      key="community" 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      className="flex flex-col h-[calc(100vh-180px)] py-4"
    >
      {/* Sub Tabs */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-2xl mb-6 border border-white/5 shadow-inner">
        {[
          { id: 'chat' as const, label: 'Live Chat', icon: LucideIcons.MessageSquare },
          { id: 'messages' as const, label: 'Inbox', icon: LucideIcons.Mail },
          { id: 'friends' as const, label: 'Friends', icon: LucideIcons.Users },
          { id: 'leagues' as const, label: 'Leagues', icon: LucideIcons.Swords },
        ].map((tab) => {
          const isActive = communityTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCommunityTab(tab.id)}
              className={cn(
                "flex-1 py-3 px-1 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 relative",
                isActive ? "text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeCommunityTab" 
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <tab.icon size={14} className={cn("relative z-10", isActive ? "text-blue-400" : "text-slate-500")} />
              <span className="relative z-10">{tab.label}</span>
              
              {tab.id === 'friends' && friendRequests.filter(r => r.receiverId === user?.uid && r.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce border border-slate-950">
                  {friendRequests.filter(r => r.receiverId === user?.uid && r.status === 'pending').length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {communityTab === 'chat' && (
        <>
          {/* Search bar inside community chat */}
          <div className="mb-4 px-2">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search community messages..." 
                className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-12 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                value={communitySearchQuery}
                onChange={(e) => setCommunitySearchQuery(e.target.value)}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors">
                <LucideIcons.Search size={14} />
              </div>
              {communitySearchQuery && (
                <button 
                  onClick={() => setCommunitySearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <LucideIcons.X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-4">
            {communityMessages.length === 0 ? (
              <div className="py-12 text-center">
                <button 
                  onClick={() => {}}
                  className="text-slate-500 text-xs font-black uppercase tracking-widest opacity-60"
                >
                  No messages found
                </button>
              </div>
            ) : (
              communityMessages
                .filter(msg => 
                  msg.content.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
                  msg.displayName.toLowerCase().includes(communitySearchQuery.toLowerCase())
                )
                .map((msg) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={msg.id} 
                    className={cn("flex gap-4 max-w-[85%] group", msg.uid === user?.uid ? "ml-auto flex-row-reverse" : "items-start")}
                  >
                    <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-lg cursor-pointer hover:scale-105 transition-transform animate-float" onClick={() => fetchUserProfile(msg.uid)}>
                      <AnimatedAvatar src={msg.photoURL} alt={msg.displayName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col relative">
                      <div 
                        onClick={() => setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)}
                        className={cn(
                          "px-5 py-3 rounded-[1.5rem] text-sm leading-relaxed shadow-sm relative cursor-pointer transition-all",
                          msg.uid === user?.uid 
                            ? "bg-blue-600 text-white rounded-tr-none" 
                            : "glass-card text-slate-200 rounded-tl-none",
                          selectedMessageId === msg.id && (msg.uid === user?.uid ? "ring-2 ring-blue-400" : "ring-2 ring-blue-500/50")
                        )}
                      >
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            msg.uid !== user?.uid && handleUserClick(msg.uid, msg.displayName, msg.photoURL);
                          }}
                          className={cn("text-[9px] font-black uppercase tracking-widest mb-1 opacity-70", msg.uid !== user?.uid && "cursor-pointer hover:text-blue-400 transition-colors", msg.uid === user?.uid ? "text-right" : "")}
                        >
                          {msg.displayName}
                        </div>
                        <p dir="auto">{msg.content}</p>
                        <div className={cn(
                          "absolute top-1/2 -translate-y-1/2 flex flex-col gap-1 transition-all z-20",
                          selectedMessageId === msg.id ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:scale-100 lg:group-hover:pointer-events-auto",
                          msg.uid === user?.uid ? "-left-12" : "-right-12"
                        )}>
                          {msg.uid !== user?.uid && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportingMessage(msg);
                                setSelectedMessageId(null);
                              }}
                              className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-red-500 transition-colors border border-white/5 shadow-xl"
                              title="Report Message"
                            >
                              <LucideIcons.Flag size={14} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(`Community Message from ${msg.displayName}`, msg.content);
                              setSelectedMessageId(null);
                            }}
                            className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-blue-400 transition-colors border border-white/5 shadow-xl"
                            title="Share Message"
                          >
                            <LucideIcons.Share2 size={14} />
                          </button>
                          {msg.uid !== user?.uid && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                startPrivateChat({ uid: msg.uid, displayName: msg.displayName, photoURL: msg.photoURL });
                                setSelectedMessageId(null);
                              }}
                              className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors border border-white/5 shadow-xl"
                              title="Inbox"
                            >
                              <LucideIcons.MessageSquare size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <span className={cn("text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-tighter", msg.uid === user?.uid ? "text-right" : "")}>
                        {safeFormat(msg.timestamp, 'HH:mm')}
                      </span>
                    </div>
                  </motion.div>
                )))}
          </div>
          
          <div className="mt-4 glass-card rounded-3xl p-2 flex gap-2 border border-white/10 shadow-2xl">
            <input 
              type="text" 
              dir="auto"
              placeholder="Share your progress with others..." 
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-slate-100 placeholder:text-slate-600" 
              value={communityInput}
              onChange={(e) => setCommunityInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendCommunityMessage(); }} 
            />
            <button 
              onClick={sendCommunityMessage}
              disabled={!communityInput.trim()}
              className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              <LucideIcons.Send size={20} />
            </button>
          </div>
        </>
      )}

      {communityTab === 'friends' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {/* Friend Requests */}
            {friendRequests.filter(r => r.receiverId === user?.uid && r.status === 'pending').length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Friend Requests</h3>
                <div className="space-y-3">
                  {friendRequests.filter(r => r.receiverId === user?.uid && r.status === 'pending').map(request => {
                    return (
                      <div key={request.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                            <LucideIcons.User size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Someone wants to connect</p>
                            <p className="text-[10px] text-slate-500">Pending request</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => acceptFriendRequest(request.id)}
                            className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
                          >
                            <LucideIcons.Check size={16} />
                          </button>
                          <button 
                            onClick={() => removeFriend(request.id)}
                            className="w-8 h-8 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <LucideIcons.X size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Your Friends ({friends.length})</h3>
              {friends.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 text-center glass-card rounded-[2rem] border-dashed border-2 border-white/5"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full flex items-center justify-center text-blue-500/50 mx-auto mb-4 relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                    <LucideIcons.Users size={32} className="relative z-10" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-white mb-2">No Friends Yet</h3>
                  <p className="text-slate-400 text-sm max-w-[200px] mx-auto mb-6">Connect with others to share your journey and compete in leagues.</p>
                  <button 
                    onClick={() => {
                      setCommunityTab('chat');
                    }}
                    className="px-6 py-3 bg-blue-500/10 text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 mx-auto"
                  >
                    <LucideIcons.MessageSquare size={16} />
                    Join Live Chat
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {friends.map(friend => (
                    <div 
                      key={friend.uid} 
                      className="glass-card p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-colors cursor-pointer"
                      onClick={() => handleUserClick(friend.uid, friend.displayName, friend.photoURL)}
                    >
                      <div className="flex items-center gap-4">
                        <AnimatedAvatar src={friend.photoURL} alt={friend.displayName} className="w-12 h-12 rounded-xl object-cover animate-float" />
                        <div>
                          <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{friend.displayName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                              <LucideIcons.Zap size={10} /> {friend.points || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          startPrivateChat({ uid: friend.uid, displayName: friend.displayName, photoURL: friend.photoURL });
                        }}
                        className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors"
                      >
                        <LucideIcons.MessageSquare size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {communityTab === 'messages' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {!activeChat ? (
            <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
              {/* User Search Bar */}
              <div className="px-2">
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Search users to chat..." 
                    className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-12 py-3.5 text-xs text-slate-100 placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors">
                    <LucideIcons.Search size={14} />
                  </div>
                  {userSearchQuery && (
                    <button 
                      onClick={() => {
                        setUserSearchQuery('');
                        searchUsers('');
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      <LucideIcons.X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* User Search Results */}
              {userSearchQuery && (
                <div className="space-y-3 px-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Search Results</h3>
                  {isSearchingUsers ? (
                    <div className="text-center py-4 text-xs text-slate-500">Searching users...</div>
                  ) : userSearchResults.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500">No users found</div>
                  ) : (
                    userSearchResults.map(result => (
                      <div 
                        key={result.uid} 
                        className="glass-card p-4 rounded-2xl flex items-center justify-between hover:border-blue-500/30 transition-colors cursor-pointer"
                        onClick={() => fetchUserProfile(result.uid)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                            <AnimatedAvatar src={result.photoURL} alt={result.displayName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{result.displayName}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{result.class || 'Amateur'}</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            startPrivateChat({ uid: result.uid, displayName: result.displayName, photoURL: result.photoURL });
                          }}
                          className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500 hover:text-white transition-colors"
                        >
                          Message
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Inbox list */}
              <div className="px-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Recent Chats</h3>
                {privateChats.length === 0 ? (
                  <div className="py-12 text-center glass-card rounded-[2rem] border-dashed border-2 border-white/5">
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest opacity-60">No private conversations yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {privateChats.map(chat => (
                      <div 
                        key={chat.id} 
                        className="glass-card p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-colors cursor-pointer"
                        onClick={() => setActiveChat(chat)}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div 
                            className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (chat.otherParticipant) fetchUserProfile(chat.otherParticipant.uid);
                            }}
                          >
                            <AnimatedAvatar src={chat.otherParticipant?.photoURL} alt={chat.otherParticipant?.displayName || 'User'} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">{chat.otherParticipant?.displayName || 'User'}</h4>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{chat.lastMessage || 'No messages yet'}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          {chat.lastMessageTimestamp && (
                            <p className="text-[10px] text-slate-500 font-medium">
                              {safeFormat(chat.lastMessageTimestamp, 'MMM d, HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Active Inbox Chat Screen */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5 px-2">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveChat(null)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <LucideIcons.ArrowLeft size={18} />
                  </button>
                  <div 
                    className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 cursor-pointer"
                    onClick={() => fetchUserProfile(activeChat.otherParticipant?.uid)}
                  >
                    <AnimatedAvatar src={activeChat.otherParticipant?.photoURL} alt={activeChat.otherParticipant?.displayName || 'User'} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{activeChat.otherParticipant?.displayName || 'User'}</h3>
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active Session
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar pb-4 flex flex-col-reverse">
                {(() => {
                  const reversedMessages = [...privateMessages].reverse();
                  return reversedMessages.map((msg, i) => {
                    const isFirstFromSender = i === reversedMessages.length - 1 || reversedMessages[i+1].senderUid !== msg.senderUid;
                    const isMe = msg.senderUid === user?.uid;
                    return (
                      <div key={msg.id || i} className={cn("flex gap-3 max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                        {!isMe && isFirstFromSender ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer" onClick={() => fetchUserProfile(msg.senderUid)}>
                            <AnimatedAvatar src={activeChat.otherParticipant?.photoURL} alt={activeChat.otherParticipant?.displayName || 'User'} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 flex-shrink-0" />
                        )}
                        <div>
                          <div className={cn(
                            "px-4 py-2.5 rounded-2xl text-sm",
                            isMe ? "bg-blue-600 text-white rounded-tr-none" : "glass-card text-slate-200 rounded-tl-none"
                          )}>
                            <p dir="auto">{msg.content}</p>
                          </div>
                          <span className="text-[9px] text-slate-600 mt-1 block uppercase tracking-tighter">
                            {safeFormat(msg.timestamp, 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              
              <div className="mt-4 glass-card rounded-3xl p-2 flex gap-2 border border-white/10 shadow-2xl mx-2">
                <input 
                  type="text" 
                  dir="auto"
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-slate-100 placeholder:text-slate-600" 
                  value={privateInput}
                  onChange={(e) => setPrivateInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendPrivateMessage(); }} 
                />
                <button 
                  onClick={sendPrivateMessage}
                  disabled={!privateInput.trim()}
                  className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
                >
                  <LucideIcons.Send size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {communityTab === 'leagues' && (
        <div className="flex-1 flex flex-col overflow-hidden space-y-6 overflow-y-auto custom-scrollbar pr-2">
          {/* Boss Battle Section */}
          <div className="tech-card border-amber-500/20 relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-colors pointer-events-none" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30">
                  <LucideIcons.Swords size={24} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg">{communityGoal.title}</h3>
                  <p className="text-xs text-slate-400">{communityGoal.description}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 relative z-10">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Boss</p>
                  <p className="font-bold text-amber-400">{communityGoal.bossName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Boss Health</p>
                  <p className="font-bold text-white">{communityGoal.bossHealth}%</p>
                </div>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${communityGoal.bossHealth}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-red-500 to-amber-500"
                />
              </div>
              <p className="text-center text-[10px] text-slate-500 mt-3 font-bold uppercase tracking-widest">
                {communityGoal.current} / {communityGoal.target} logged by community
              </p>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Global Leaderboard</h3>
            <div className="space-y-2">
              {leaderboard.map((user, index) => (
                <div key={user.uid} className="tech-card border-white/5 hover:border-white/10 flex items-center gap-4 transition-all hover:scale-[1.01]">
                  <div className="w-8 text-center font-display font-black text-slate-500 text-lg">
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 animate-float">
                    <AnimatedAvatar src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm">{user.displayName}</h4>
                    <p className="text-xs text-slate-400">{user.achievements?.length || 0} Achievements</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{user.points || 0}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Points</p>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Loading leaderboard...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
