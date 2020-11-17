import React, { useState, useCallback, useEffect } from 'react'
import {
    SafeAreaView,
    StyleSheet
} from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat'

// Functions
import bayes from '../../functions/BayesNaive/BayesNaiveFunction'

// Tranning Data
import { spam } from '../../DataTraining/spam'

var classifier = bayes()

const ChatScreen = () => {
    const [messages, setMessages] = useState([]);

    const user = {
        _id: 1,
    }

    const training = async () => {
        // teach it a positive phrase

        await classifier.learn('amazing, awesome movie!!, Yeah!!, Oh boy.', 'positive')
        await classifier.learn('Sweet, this is incredibly, amazing, perfect, great!!', 'positive')
        await classifier.learn('baby, honey, love, hug, beautiful', 'positive')
        await classifier.learn('nice!, good, best, handsome', 'positive')

        // teach it a negative phrase

        // await classifier.learn('terrible, shitty thing. Damn. Sucks!!', 'negative')
        // await classifier.learn('fuck, fucker. sucker. loser!!', 'negative')
        // await classifier.learn('nam, ngu, idiot. ass. sex!!', 'negative')
        await classifier.learn(spam, 'negative')
    }

    useEffect(() => {
        training()
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
        ])
    }, [])


    const onSendMessage = useCallback(async (messages = []) => {
        if (messages[0].text) {
            let result = await classifier.categorize(messages[0].text)
            result === 'negative' ? alert('Nói bậy ít thôi :)') : setMessages(previousMessages => GiftedChat.append(previousMessages, messages))
        }
    }, [])

    return (
        <>
            <SafeAreaView style={styles.wrapper}>
                <GiftedChat
                    messages={messages}
                    onSend={onSendMessage}
                    user={user}
                />
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: 'white'
    },

});

export default ChatScreen;