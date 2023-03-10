import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Clock from '../components/Clock';
import Header from '../components/Header';
import { addToScoreAction, resetTime } from '../redux/actions';
import apiQuestions from '../services/apiQuestions';
import '../styles/Game.css';

const INDEX_RANDOM = 0.5;
const LENGTH_QUESTIONS = 4;

class Game extends Component {
  state = {
    questions: [],
    indexQuestion: 0,
    answers: [],
    correctAnswer: '',
    givenAnswer: false,
    timeIsExpired: false,
    currentCount: 30,
  };

  componentDidMount() {
    this.getQuestions();
  }

  getQuestions = async () => {
    const questions = await apiQuestions();
    if (questions === undefined || !questions.length) {
      localStorage.removeItem('token');
      const { history } = this.props;
      history.push('/');
    } else {
      const answers = [
        questions[0].correct_answer,
        ...questions[0].incorrect_answers,
      ];
      this.setState({
        questions,
        answers: this.shuffleArray(answers),
        correctAnswer: questions[0].correct_answer,
      });
    }
  };

  // https://teamtreehouse.com/community/return-mathrandom05
  shuffleArray = (answers) => answers.sort(() => Math.random() - INDEX_RANDOM);

  handleClick = (answer, correctAnswer, difficulty) => {
    const hard = 3;
    const medium = 2;
    const easy = 1;
    const { dispatch } = this.props;
    const { currentCount } = this.state;
    if (answer === correctAnswer) {
      const INITIAL_POINT = 10;
      switch (difficulty) {
      case 'hard':
        dispatch(addToScoreAction(INITIAL_POINT + currentCount * hard));
        break;
      case 'medium':
        dispatch(addToScoreAction(INITIAL_POINT + currentCount * medium));
        break;
      default:
        dispatch(addToScoreAction(INITIAL_POINT + currentCount * easy));
      }
    }
    this.setState({ timeIsExpired: true, givenAnswer: true });
  };

  changeColor = (isCorrect) => (isCorrect ? 'correctAnswer' : 'incorrectAnswer');

  updateClock = (currentCount) => {
    this.setState({ currentCount });
  };

  handleExpired = () => {
    this.setState({ timeIsExpired: true });
  };

  nextQuestion = () => {
    const { dispatch, name, gravatarEmail, score } = this.props;
    dispatch(resetTime(true));
    this.setState(({ indexQuestion, questions }) => {
      if (indexQuestion === LENGTH_QUESTIONS) {
        const userScore = {
          name,
          score,
          gravatarEmail,
        };
        const rankings = JSON.parse(localStorage.getItem('ranking'));
        if (rankings) {
          localStorage.setItem('ranking', JSON.stringify([...rankings, userScore]));
        } else {
          localStorage.setItem('ranking', JSON.stringify([userScore]));
        }
        const { history } = this.props;
        return history.push('/feedback');
      }
      const currentIndex = indexQuestion + 1;
      const answers = [questions[currentIndex].correct_answer,
        ...questions[currentIndex].incorrect_answers];
      return {
        givenAnswer: false,
        resetTime: true,
        indexQuestion: currentIndex,
        answers: this.shuffleArray(answers),
        correctAnswer: questions[currentIndex].correct_answer,
        timeIsExpired: false,
      };
    });
  };

  decodeEntity = (inputStr) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = inputStr;
    return textarea.value;
  };

  render() {
    const {
      questions,
      answers,
      correctAnswer,
      indexQuestion,
      givenAnswer,
      timeIsExpired,
    } = this.state;
    const question = questions[indexQuestion];
    return (
      <section>
        <Header />
        <Clock
          updateClock={ this.updateClock }
          handleExpired={ this.handleExpired }
        />
        {question && (
          <div>
            <p data-testid="question-category">{question.category}</p>
            <p data-testid="question-text">{this.decodeEntity(question.question)}</p>
            <div data-testid="answer-options">
              {answers.map((answer, index) => (
                <button
                  type="button"
                  key={ answer }
                  className={
                    givenAnswer
                      ? this.changeColor(answer === correctAnswer)
                      : undefined
                  }
                  data-testid={
                    answer === correctAnswer
                      ? 'correct-answer'
                      : `wrong-answer-${index}`
                  }
                  onClick={
                    () => this.handleClick(answer, correctAnswer, question.difficulty)
                  }
                  disabled={ timeIsExpired }
                >
                  {this.decodeEntity(answer)}
                </button>
              ))}
              {givenAnswer && (
                <button
                  type="button"
                  data-testid="btn-next"
                  onClick={ this.nextQuestion }
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    );
  }
}

Game.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  gravatarEmail: PropTypes.string.isRequired,
  score: PropTypes.number.isRequired,

};

const mapStateToProps = ({ player }) => ({
  ...player,
});

const mapDispatchToProps = (dispatch) => ({
  dispatch,
});

export default connect(mapStateToProps, mapDispatchToProps)(Game);
