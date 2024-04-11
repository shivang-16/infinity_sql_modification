/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import "../../components/Posts/post.scss";
import { Link, useNavigate } from "react-router-dom";
import unlike from "../../assets/unlike.png";
import liked from "../../assets/liked.png";
import commentsImg from "../../assets/comment.png";
import bookmark from "../../assets/bookmark.png";
import bookmarked from "../../assets/bookmarksolid.png";
import { useSelector, useDispatch } from "react-redux";
import { likePost } from "../../redux/actions/Post";
import { commentPost } from "../../redux/actions/Post";
import { bookmarkPost } from "../../redux/actions/Post";
import { getPostById } from "../../redux/actions/Post";
import { deletePost } from "../../redux/actions/Post";
import { editPost } from "../../redux/actions/Post";
import { getAllPost } from "../../redux/actions/Post";
import { loadUser } from "../../redux/actions/User";
import User from "../User/User";
import user2Img from "../../assets/user.png";
import { setProgress } from "../../redux/reducers/LoadingBar";
import Linkify from 'react-linkify';

//get caption , id(postId), likes , owner from props
const PostBody = ({
  postId,
  userId,
  caption,
  postImage,
  likes,
  comments,
  createdAt,
  isLikedByCurrentUser,
  isSavedByCurrentUser,
  image,
  owner
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => ({ /* Select user data from state */ }));
  const [isLiked, setIsLiked] = useState(isLikedByCurrentUser);
  const [isSaved, setIsSaved] = useState(isSavedByCurrentUser);
  const [likeCount, setLikeCount] = useState(likes?.length);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    setIsLiked(isLikedByCurrentUser);
    setIsSaved(isSavedByCurrentUser);
    setLikeCount(likes?.length);
  }, [likes, isLikedByCurrentUser, isSavedByCurrentUser]);

  const handleLike = () => {
    if (isLiked) {
      dispatch(unlikePost(postId));
      setLikeCount(likeCount - 1);
    } else {
      dispatch(likePost(postId));
      setLikeCount(likeCount + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleSave = () => {
    if (isSaved) {
      dispatch(unsavePost(postId));
    } else {
      dispatch(savePost(postId));
    }
    setIsSaved(!isSaved);
  };

  const handleDeletePost = () => {
    dispatch(deletePost(postId));
    // Optionally redirect or update UI upon deletion
  };

  const submitComment = () => {
    // Logic to submit comment
    setCommentText(""); // Clear comment input after submission
    setShowComments(true); // Optionally show comments section after adding a new comment
  };

  return (
    <div className="post">
      <div className="post-header">
        <div className="user-info">
          {/* User info and avatar */}
          <Link to={`/profile/${userId}`}>{
            <User
            userId={owner?.id}
            userName={owner?.userName}
            name={owner?.name}
            avatar={owner?.avatar?.url}
          />
          }</Link>
        </div>
        {/* <img src={more} alt="More options" className="options-icon" /> */}
      </div>
      <div className="caption">
        <Linkify>{caption}</Linkify>
      </div>
      {image ? (
              <div className="image">
                <img src={image} alt="" />
              </div>
            ) : (
              ""
            )}
     
      <div className="post-footer">
          <div>
            <button className="like action" >
            <img src={isLiked ? liked : unlike} alt="Like" onClick={handleLike} />
            </button>
            
          </div>
          <div>
            <button className="comment action" >
            <img src={commentsImg} alt="Comments" onClick={() => setShowComments(!showComments)} />
            </button>
          </div>
          <div>
            <button className="bookmark action" >
            <img src={isSaved ? bookmarked : bookmark} alt="Bookmark" onClick={handleSave} />
            </button>
          </div>
        </div>
      {/* <div className="post-actions">
        <img src={isLiked ? liked : unlike} alt="Like" onClick={handleLike} />
        <img src={commentsImg} alt="Comments" onClick={() => setShowComments(!showComments)} />
        <img src={isSaved ? bookmarked : bookmark} alt="Bookmark" onClick={handleSave} />
      </div> */}

      <div className="likes">{likeCount} likes</div>

     

      {showComments && (
        <div className="comments">
          {/* Render comments */}
        </div>
      )}

      <div className="add-comment">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
        />
        <button onClick={submitComment}>Post</button>
      </div>

      <div className="post-timestamp">
        {/* {moment(createdAt).fromNow()} */}
      </div>

 
    </div>
  );
};

export default PostBody;