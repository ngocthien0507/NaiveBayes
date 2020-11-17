/*
    Expose our naive-bayes generator function
 */
export default function (options) {
    return new Naivebayes(options)
}

// keys we use to serialize a classifier's state
var STATE_KEYS = module.exports.STATE_KEYS = [
    'categories', 'docCount', 'totalDocuments', 'vocabulary', 'vocabularySize',
    'wordCount', 'wordFrequencyCount', 'options'
];

/**
 * Initializes a NaiveBayes instance from a JSON state representation.
 * Use this with classifier.toJson().
 *
 * @param  {String} jsonStr   state representation obtained by classifier.toJson()
 * @return {NaiveBayes}       Classifier
 */
export function fromJson(jsonStr) {
    var parsed;
    try {
        parsed = JSON.parse(jsonStr)
    } catch (e) {
        throw new Error('Naivebayes.fromJson expects a valid JSON string.')
    }
    // init a new classifier
    var classifier = new Naivebayes(parsed.options)

    // override the classifier's state
    STATE_KEYS.forEach(function (k) {
        if (typeof parsed[k] === 'undefined' || parsed[k] === null) {
            throw new Error('Naivebayes.fromJson: JSON string is missing an expected property: `' + k + '`.')
        }
        classifier[k] = parsed[k]
    })

    return classifier
}

/**
 * Given an input string, tokenize it into an array of word tokens.
 * This is the default tokenization function used if user does not provide one in `options`.
 *
 * @param  {String} text
 * @return {Array}
 */
var defaultTokenizer = function (text) {
    //remove punctuation from text - remove anything that isn't a word char or a space
    var rgxPunctuation = /[^(a-zA-ZA-Яa-я0-9_)+\s]/g
    var sanitized = text.replace(rgxPunctuation, ' ')
    return sanitized.split(/\s+/)
}


const accentTidy = (str) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
}
/**
 * Naive-Bayes Classifier
 *
 * This is a naive-bayes classifier that uses Laplace Smoothing.
 *
 * Takes an (optional) options object containing:
 *   - `tokenizer`  => custom tokenization function
 *
 */
class Naivebayes {
    constructor(options) {
        // set options object
        this.options = {};
        if (typeof options !== 'undefined') {
            if (!options || typeof options !== 'object' || Array.isArray(options)) {
                throw TypeError('NaiveBayes got invalid `options`: `' + options + '`. Pass in an object.');
            }
            this.options = options;
        }

        this.tokenizer = this.options.tokenizer || defaultTokenizer;

        //initialize our vocabulary and its size
        this.vocabulary = {};
        this.vocabularySize = 0;

        //number of documents we have learned from
        this.totalDocuments = 0;

        //document frequency table for each of our categories
        //=> for each category, how often were documents mapped to it
        this.docCount = {};

        //for each category, how many words total were mapped to it
        this.wordCount = {};

        //word frequency table for each category
        //=> for each category, how frequent was a given word mapped to it
        this.wordFrequencyCount = {};

        //hashmap of our category names
        this.categories = {};
    }
    /**
     * Initialize each of our data structure entries for this new category
     *
     * @param  {String} categoryName
     */
    initializeCategory(categoryName) {
        if (!this.categories[categoryName]) {
            this.docCount[categoryName] = 0;
            this.wordCount[categoryName] = 0;
            this.wordFrequencyCount[categoryName] = {};
            this.categories[categoryName] = true;
        }
        return this;
    }
    /**
     * train our naive-bayes classifier by telling it what `category`
     * the `text` corresponds to.
     *
     * @param  {String} text
     * @param  {Promise<String>} class
     */
    async learn(text, category) {
        var self = this;

        //initialize category data structures if we've never seen this category
        self.initializeCategory(category);

        //update our count of how many documents mapped to this category
        self.docCount[category]++;

        //update the total number of documents we have learned from
        self.totalDocuments++;

        //normalize the text into a word array
        var tokens = await self.tokenizer(accentTidy(text));
        //get a frequency count for each token in the text
        var frequencyTable = self.frequencyTable(tokens);

        /*
            Update our vocabulary and our word frequency count for this category
         */
        Object
            .keys(frequencyTable)
            .forEach(function (token) {
                //add this word to our vocabulary if not already existing
                if (!self.vocabulary[token]) {
                    self.vocabulary[token] = true;
                    self.vocabularySize++;
                }

                var frequencyInText = frequencyTable[token];

                //update the frequency information for this word in this category
                if (!self.wordFrequencyCount[category][token])
                    self.wordFrequencyCount[category][token] = frequencyInText;

                else
                    self.wordFrequencyCount[category][token] += frequencyInText;

                //update the count of all words we have seen mapped to this category
                self.wordCount[category] += frequencyInText;
            });
        return self;
    }
    /**
     * Determine what category `text` belongs to.
     *
     * @param  {String} text
     * @return {Promise<string>} category
     */
    async categorize(text) {
        var self = this,
            maxProbability = -Infinity,
            chosenCategory = null;

        var tokens = await self.tokenizer(accentTidy(text));
        var frequencyTable = self.frequencyTable(tokens);

        //iterate thru our categories to find the one with max probability for this text
        Object
            .keys(self.categories)
            .forEach(function (category) {

                //start by calculating the overall probability of this category
                //=>  out of all documents we've ever looked at, how many were
                //    mapped to this category
                var categoryProbability = self.docCount[category] / self.totalDocuments;

                //take the log to avoid underflow
                var logProbability = Math.log(categoryProbability);

                //now determine P( w | c ) for each word `w` in the text
                Object
                    .keys(frequencyTable)
                    .forEach(function (token) {
                        var frequencyInText = frequencyTable[token];
                        var tokenProbability = self.tokenProbability(token, category);

                        //console.log('token: %s category: `%s` tokenProbability: %d', token, category, tokenProbability)
                        //determine the log of the P( w | c ) for this word
                        logProbability += frequencyInText * Math.log(tokenProbability);
                    });

                if (logProbability > maxProbability) {
                    maxProbability = logProbability;
                    chosenCategory = category;
                }
            });

        return chosenCategory;
    }
    /**
     * Calculate probability that a `token` belongs to a `category`
     *
     * @param  {String} token
     * @param  {String} category
     * @return {Number} probability
     */
    tokenProbability(token, category) {
        //how many times this word has occurred in documents mapped to this category
        var wordFrequencyCount = this.wordFrequencyCount[category][token] || 0;

        //what is the count of all words that have ever been mapped to this category
        var wordCount = this.wordCount[category];

        //use laplace Add-1 Smoothing equation
        return (wordFrequencyCount + 1) / (wordCount + this.vocabularySize);
    }
    /**
     * Build a frequency hashmap where
     * - the keys are the entries in `tokens`
     * - the values are the frequency of each entry in `tokens`
     *
     * @param  {Array} tokens  Normalized word array
     * @return {Object}
     */
    frequencyTable(tokens) {
        var frequencyTable = Object.create(null);

        tokens.forEach(function (token) {
            if (!frequencyTable[token])
                frequencyTable[token] = 1;

            else
                frequencyTable[token]++;
        });

        return frequencyTable;
    }
    /**
     * Dump the classifier's state as a JSON string.
     * @return {String} Representation of the classifier.
     */
    toJson() {
        var state = {};
        var self = this;
        STATE_KEYS.forEach(function (k) {
            state[k] = self[k];
        });

        var jsonStr = JSON.stringify(state);

        return jsonStr;
    }
}







