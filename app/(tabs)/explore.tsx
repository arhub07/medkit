import { Platform, Text, View, StyleSheet, TextInput, TouchableOpacity, Pressable, FlatList, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, ImageBackground } from 'expo-image';
import tw from "twrnc";
import { Input } from '@rneui/themed';
import { Formik } from "formik";
import * as Yup from "yup";
import { Redirect, Link, router } from "expo-router";
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useRef } from 'react';
import type { Profile, Chat } from '@/types/database';
import { defaultSystemMessage, type Message, streamChatResponse } from '@/lib/openai';
import { ChatSidebar } from '@/components/ChatSidebar';
import { MaterialIcons } from '@expo/vector-icons';
import { openDevMenu } from 'expo-dev-client';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { useFonts } from "expo-font";

const validation = Yup.object().shape({
    prompt: Yup.string().required().label("Prompt"),
})

const PromptPage = () => {

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([defaultSystemMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [partialResponse, setPartialResponse] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      fetchChats();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session!.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: session!.user.id,
          title: 'New Chat',
        })
        .select()
        .single();

      if (error) throw error;
      
      setChats(prev => [data, ...prev]);
      setCurrentChatId(data.id);
      setMessages([defaultSystemMessage]);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages([
        defaultSystemMessage,
        ...(messages || []).map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        }))
      ]);
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSubmit = async (values: { prompt: string }) => {
    try {
      setIsLoading(true);
      setIsTyping(true);
      
      let chatId = currentChatId;
      
      // Create new chat if none selected
      if (!chatId) {
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({
            user_id: session!.user.id,
            title: values.prompt.slice(0, 50),
          })
          .select()
          .single();

        if (chatError) throw chatError;
        
        chatId = newChat.id;
        setCurrentChatId(chatId);
        setChats(prev => [newChat, ...prev]);
      }

      const userMessage: Message = {
        role: 'user',
        content: values.prompt,
      };

      // Save user message to database
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          role: 'user',
          content: values.prompt,
          created_at: new Date().toISOString(),
        });

      if (messageError) throw messageError;

      // Add user message to the chat
      setMessages(prev => [...prev, userMessage]);

      try {
        // Stream the response
        let fullResponse = '';
        // Add empty assistant message that will be updated
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        
        for await (const chunk of streamChatResponse([...messages, userMessage])) {
          setIsTyping(false); // Hide typing indicator once streaming starts
          fullResponse += chunk;
          // Update the assistant's message with accumulated response
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: fullResponse }
          ]);
        }

        // Save complete assistant message to database
        const { error: assistantError } = await supabase
          .from('messages')
          .insert({
            chat_id: chatId,
            role: 'assistant',
            content: fullResponse,
            created_at: new Date().toISOString(),
          });

        if (assistantError) throw assistantError;

        // Update chat's last message and timestamp
        await supabase
          .from('chats')
          .update({ 
            last_message: fullResponse,
            updated_at: new Date().toISOString(),
          })
          .eq('id', chatId);

        // Refresh chats list
        fetchChats();

      } catch (streamError) {
        console.error('Streaming error:', streamError);
        // Only remove the assistant message if there's an error
        setMessages(prev => prev.slice(0, -1));
        throw streamError;
      }

    } catch (error) {
      console.error('Error in chat:', error);
      alert('Error sending message');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Add dev menu handler
  const handleDevMenu = () => {
    if (__DEV__) {
      openDevMenu();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground 
        source={require('@/assets/images/mainbg.png')} 
        style={styles.backgroundImage}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => setIsSidebarOpen(true)}
              >
                <Image 
                          source={require('@/assets/images/menu.png')} 
                          style={styles.menuIcon}
                  />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDevMenu}>
                <Text style={styles.title}>MedKit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>

            <ChatSidebar
              chats={chats}
              currentChatId={currentChatId}
              onChatSelect={loadChat}
              onNewChat={createNewChat}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />

            {messages.length === 1 && (
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>Hi, how can I help you?</Text>
              </View>
            )}

            <View style={styles.content}>
              <View style={styles.chatArea}>
                <FlatList
                  ref={flatListRef}
                  data={messages.slice(1)}
                  keyExtractor={(_, index) => index.toString()}
                  style={styles.chatContainer}
                  contentContainerStyle={styles.chatContentContainer}
                  renderItem={({ item }) => (
                    <View style={[
                      styles.messageContainer,
                      item.role === 'user' ? styles.userMessage : styles.assistantMessage
                    ]}>
                      <Text style={[
                        styles.messageText,
                        item.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                      ]}>
                        {item.role === 'assistant' && isTyping ? 'Medkit is thinking...' : item.content}
                      </Text>
                    </View>
                  )}
                />

                <Formik
                  initialValues={{ prompt: '' }}
                  validationSchema={validation}
                  onSubmit={(values, { resetForm }) => {
                    handleSubmit(values);
                    resetForm();
                  }}
                >
                  {({ handleSubmit, values, handleChange }) => (
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Message Medkit..."
                        placeholderTextColor="#bfbee8"
                        value={values.prompt}
                        onChangeText={handleChange('prompt')}
                        multiline
                        maxHeight={100}
                      />
                      <TouchableOpacity 
                        onPress={() => handleSubmit()}
                        style={[
                          styles.sendButton, 
                          (!values.prompt || isLoading) && styles.sendButtonDisabled
                        ]}
                        disabled={!values.prompt || isLoading}
                      >
                        <Image 
                          source={require('@/assets/images/send.png')} 
                          style={styles.sendIcon}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </Formik>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

export default PromptPage;

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    
  },
  title: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
    fontFamily: "Nunito_700Bold"
  },
  welcomeContainer: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '300',
  
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chatContentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(203, 199, 244, 0.9)',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    marginBottom: Platform.OS === 'android' ? 2 : -20,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: '#333',
    borderWidth: 2,
    borderColor: '#cbc7f4',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#cbc7f4',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },

  menuIcon: {
    width: 30,
    height: 30,
    tintColor: '#cbc7f4',
  },
  logoutButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#cbc7f4',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  chatArea: {
    flex: 1,
    justifyContent: 'space-between', // This ensures the input stays at the bottom
  },
  menuButton: {
    position: 'absolute',
    left: 16,
    padding: 4,

  },
  typingIndicator: {
    padding: 12,
    marginLeft: 12,
    marginTop: 4,
    backgroundColor: 'rgba(203, 199, 244, 0.1)',
    borderRadius: 20,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  typingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  safeArea: {
    flex: 1,
  },
});