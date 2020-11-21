import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';

// Functions
import bayes from '../../functions/BayesNaive/BayesNaiveFunction';

// Tranning Data
import * as trainingData from '../../DataTraining/trainningData';
import * as testData from '../../DataTraining/testData';

var classifier = bayes();

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [initMessage, setInitMessage] = useState('');
  const [isActiveSpamButton, setIsActiveSpamButton] = useState(false);
  const [isActiveNotSpamButton, setIsActiveNotSpamButton] = useState(false);

  const user = {
    _id: 1,
  };

  const training = async () => {
    // teach it a positive phrase

    await classifier.learn(
      'alo, da chao anh chi,tim viec lam, kiem viec lam, It, developer, lap trinh vien, mobile, react native, nodejs',
      'positive',
    );
    await classifier.learn(
      'angular js, javascript, html , css, react, tieng anh, english, toeic, ielst',
      'positive',
    );
    await classifier.learn(trainingData.notSpam, 'positive');

    // teach it a negative phrase

    await classifier.learn(trainingData.spam, 'negative');
  };

  useEffect(() => {
    training();
    return setMessages([
      {
        _id: 1,
        text: 'Hello developer',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'React Native',
          avatar: 'https://placeimg.com/140/140/any',
        },
      },
    ]);
  }, []);

  const onSendMessage = useCallback(async (messages = []) => {
    if (messages[0].text) {
      let result = await classifier.categorize(messages[0].text);
      result === 'negative'
        ? alert('spam ít thôi :)')
        : setMessages((previousMessages) =>
          GiftedChat.append(previousMessages, messages),
        );
    }
  }, []);

  const onChangeText = (text) => setInitMessage(text);

  const onPressSpamButton = () => {
    setIsActiveSpamButton(true);
    setIsActiveNotSpamButton(false);
    setInitMessage(testData.apsolutelySpam);
  };

  const onPressNotSpamButton = () => {
    setIsActiveSpamButton(false);
    setIsActiveNotSpamButton(true);
    setInitMessage(testData.notSpam);
  };

  const onPressClearButton = () => {
    setIsActiveSpamButton(false);
    setIsActiveNotSpamButton(false);
    setInitMessage('');
    setMessages([
      {
        _id: 1,
        text: 'Hello developer',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'React Native',
          avatar: 'https://placeimg.com/140/140/any',
        },
      },
    ]);
  };

  return (
    <>
      <SafeAreaView style={styles.wrapper}>
        <GiftedChat
          messages={messages}
          onSend={onSendMessage}
          user={user}
          text={initMessage}
          onInputTextChanged={onChangeText}
        />
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.buttonExample,
              isActiveSpamButton && styles.activeButton,
            ]}
            onPress={onPressSpamButton}>
            <Text style={styles.buttonText}>Spam</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.buttonExample,
              isActiveNotSpamButton && styles.activeButton,
            ]}
            onPress={onPressNotSpamButton}>
            <Text style={styles.buttonText}>Not Spam</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonExample}
            onPress={onPressClearButton}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'white',
  },
  buttonGroup: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 100,
    height: 150,
    justifyContent: 'space-around',
  },
  buttonExample: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: 'green',
  },
  buttonText: {
    color: 'white',
  },
});

export default ChatScreen;
