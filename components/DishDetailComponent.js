import React, {Component} from 'react';
import {View, Text, ScrollView, FlatList, Modal, StyleSheet, Button, Alert, PanResponder, Share} from 'react-native';
import {Card, Icon, Rating, Input } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import {postFavorite, postComment} from '../Redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
  return {
    dishes: state.dishes,
    comments: state.comments,
    favorites: state.favorites,
  }
}

const mapDispatchToProps = dispatch => ({
  postFavorite: (dishId) => dispatch(postFavorite(dishId)),
  postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment))
})
 
function RenderDish(props) {
  const dish= props.dish;

  handleViewRef = ref => this.view=ref;

  const recognizeDrag = ({ moveX, moveY, dx, dy }) => {
    if ( dx < -200 )
        return true;
    else
        return false;
}

const recognizeComment = ({ moveX, moveY, dx, dy }) => {
  if ( dx > 200 )
      return true;
  else
      return false;
}

const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (e, gestureState) => {
        return true;
    },

    onPanResponderGrant: () => {
      this.view.rubberBand(1000)
      .then(endState => console.log(endState.finished? 'finished' : 'cancelled'));
    },

    onPanResponderEnd: (e, gestureState) => {
        console.log("pan responder end", gestureState);
        if (recognizeDrag(gestureState))
            Alert.alert(
                'Add Favorite',
                'Are you sure you wish to add ' + dish.name + ' to favorite?',
                [
                {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                {text: 'OK', onPress: () => {props.favorite ? console.log('Already favorite') : props.onPress()}},
                ],
                { cancelable: false }
            );
        else if (recognizeComment(gestureState))
        {
            props.onComment();
        }
        return true;
    }
});

const shareDish = (title, message, url) => {
  Share.share({
      title: title,
      message: title + ': ' + message + ' ' + url,
      url: url
  },{
      dialogTitle: 'Share ' + title
  })
}

  if (dish!= null) {
    return(
      <Animatable.View animation="fadeInDown" duration={2000} delay={1000}
      ref={this.handleViewRef}
      {...panResponder.panHandlers}>
      <Card
        featuredTitle={dish.name}
        image={{uri: baseUrl + dish.image}}
        >
        <Text style={{margin: 10}}>
          {dish.description}
        </Text>
        <View style= {styles.Icon}>
        <Icon
          raised
          reverse
          name={props.favorite ? 'heart' : 'heart-o'}
          type="font-awesome"
          color='#f50'
          onPress={() => props.favorite ? console.log('Already favorite'): props.onPress()}
          />
          <Icon
          raised
          reverse
          name='pencil'
          type="font-awesome"
          color='#51D2A8'
          onPress={() => {props.onComment()}}
          />
          <Icon
            raised
            reverse
            name='share'
            type='font-awesome'
            color='#512DA8'
            style={styles.cardItem}
            onPress={() => shareDish(dish.name, dish.description, baseUrl + dish.image)}
            />                
        </View>
      </Card>
      </Animatable.View>
    );
  }
  else {
    return (<View></View>)
  }
}

function RenderComments(props) {
  const comments = props.comments;

  const RenderCommentItem = ({item, index}) => {
    return(
      <View key = {index} style = {{margin:10}}>
        <Text style = {{fontSize:14}}>{item.comment}</Text>
        <Text style = {{fontSize:12}}>{item.rating} Stars</Text>
        <Text style = {{fontSize:12}}>{'--' + item.author + ',' + item.date} </Text>
      </View>
    );
  }
  return(
    <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>        
    <Card title="Comments">
      <FlatList
        data={comments}
        renderItem= {RenderCommentItem}
        keyExtractor={item => item.id.toString()}
        />
    </Card>
    </Animatable.View>
  );
}

class DishDetail extends Component {
  constructor(props) {
    super(props);

    this.state = {
        rating: 5,
        author: '',
        comment:'',
        date:'',
        showModal: false,
    }
  }
  markFavorite(dishId) {
    this.props.postFavorite(dishId);
  }

  static navigationOptions={
    title:'Dish Details'
  };
  
  toggleModal(){
    this.setState({ showModal: !this.state.showModal});
}

  handleComment(dishId) {
    const { rating, author, comment } = this.state;
    this.props.postComment(dishId, rating, author, comment);
    this.toggleModal();
    this.resetForm();
}

  resetForm(){
    this.setState({
        rating: 5,
        author: '',
        comment: '',
        date: '',
        showModal: false
    });
  }

  render() {
    const dishId = this.props.navigation.getParam('dishId', '');

    return(
      <ScrollView>
      <RenderDish dish={this.props.dishes.dishes[+dishId]} 
        favorite={this.props.favorites.some(el => el === dishId)}
        onPress = {() => this.markFavorite(dishId)}
        onComment={() => this.toggleModal()}
      />
      <RenderComments comments = {this.props.comments.comments.filter((comment) => comment.dishId === dishId )} />

        <Modal
                animationType={'slide'}
                transparent={false}
                visible={this.state.showModal}
                onDismiss={() => {this.toggleModal(); this.resetForm()}}
                onRequestClose={() => {this.toggleModal(); this.resetForm()}}
                >
                      <Rating 
                      ratingCount={5}
                      showRating
                      onFinishRating={(rating) => this.setState({rating:rating})}
                      style={{paddingVertical: 10}}
                        />
                        <Input 
                        placeholder ='Author'
                        value={this.state.author} 
                        onChangeText ={(author)=> this.setState({author:author})}
                        leftIcon={
                          <Icon
                          name='user'
                          type='font-awesome'
                          size={20}
                          />
                        }
                        />
                        <Input 
                        placeholder ='Comments'
                        value={this.state.comment} 
                        onChangeText ={(comment)=> this.setState({comment:comment})}
                        leftIcon={
                          <Icon
                          name='comment'
                          type='font-awesome'
                          size={20}
                          />
                        }
                        />
                         <Button
                          onPress = {() => {
                            this.handleComment(dishId);
                            this.resetForm();
                          }}
                          color='#6688FF'
                          title='Submit'
                          />
                         <Button 
                             onPress = {() =>{this.toggleModal(); this.resetForm();}}
                             color="#512DA8"
                             title="Cancel" 
                             />
                </Modal>
      </ScrollView>
      );
  }
}

const styles = StyleSheet.create({
  Icon: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  formRow: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'row',
    margin: 20
  },
  formLabel: {
      fontSize: 18,
      flex: 2
  },
  formItem: {
      flex: 1
  },
  modal: {
      justifyContent: 'center',
     margin: 20
  },
  modalText: {
      fontSize: 18,
      margin: 10
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(DishDetail);
