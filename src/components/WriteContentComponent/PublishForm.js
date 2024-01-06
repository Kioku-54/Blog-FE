import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import "./style/PublishForm.scss";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Radio from "@mui/material/Radio";
import { useNavigate } from "react-router";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import useUserProfile from "../../hook/useUserProfile";
import FormControlLabel from "@mui/material/FormControlLabel";
import LanguageIcon from "@mui/icons-material/Language";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import GroupIcon from "@mui/icons-material/Group";
import Tooltip from "@mui/material/Tooltip";
import {
  callPostApiWithoutToken,
  callGetApiWithoutToken,
} from "../../helpers/request";

const MIN_CATEGORIES_SHOW = 0;
const MAX_CATEGORIES_SHOW = 3;
const apiDomain = process.env.REACT_APP_API_DOMAIN;

function PublishForm(props) {
  const useProfile = useUserProfile();
  const { contentPost, setShowPublishPopup } = props;
  const [avatar, setAvatar] = useState(null);
  const [userName, setUserName] = useState(null);
  const [titlePost, setTitlePost] = useState("");
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState(null);
  const [newCategoriesList, setNewCategoriesList] = useState([]);
  const [summaryPost, setSummaryPost] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [thumbnailPost, setThumbnailPost] = useState("");
  const [thumbnailTemp, setThumbnailTemp] = useState("");
  const [permissionPost, setPermissionPost] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [displayError, setDisplayError] = useState({
    categories: false,
    permission: false,
    title: false,
    summarize: false,
  });

  const navigate = useNavigate();

  const validationForm = (title, categories, summarize, permission) => {
    const validated = {
      categories: categories.length <= 0,
      permission: permission.length <= 0,
      title: title.length <= 0,
      summarize: summarize.length <= 0,
    };
    return validated;
  };

  const updateTitlePublish = (contentPost, title) => {
    var contentJson = JSON.parse(contentPost);
    contentJson.title = title;

    return JSON.stringify(contentJson);
  };

  const onSubmit = () => {
    const title = titlePost;
    const categories = selectedCategories;
    const permission = permissionPost;
    const summarize = summaryPost;
    const thumbnail = thumbnailPost;
    const validated = validationForm(title, categories, summarize, permission);
    if (Object.values(validated).some((error) => error)) {
      setDisplayError(validated);
      return;
    }

    const contentPublish = updateTitlePublish(contentPost, title);

    handlePublishPost(
      title,
      categories,
      summarize,
      contentPublish,
      thumbnail,
      permission
    );
    setShowPublishPopup(false);
  };

  const handleCreateNewCategory = async () => {
    if (newCategoriesList.length === 0) return;
    try {
      newCategoriesList.forEach(async (category) => {
        const apiUrl = `${apiDomain}/v1/api/post/createCategrory`;
        await callPostApiWithoutToken(apiUrl, {
          categroryName: category,
        });
      });
    } catch {
      alert(
        "Add New Category Not SucessFull. Please Check Your Information Again!"
      );
    }
  };

  const handlePublishPost = async (
    title,
    categories,
    summarize,
    contentPost,
    thumbnail,
    permission
  ) => {
    if (contentPost === " return") return;

    try {
      await handleCreateNewCategory();
      const formData = new FormData();
      const postData = {
        postTitle: title,
        postPermit: permission,
        postCategory: categories,
        postSummarize: summarize,
        postContent: contentPost,
      };
      formData.append("thumbnail", thumbnail);
      formData.append("postData", JSON.stringify(postData));

      const apiUrl = `${apiDomain}/v1/api/post/publish_v2`;
      await callPostApiWithoutToken(apiUrl, formData);
      navigate("/");
    } catch (err) {
      alert("Upload File Not SucessFull. Please Check Your Information Again!");
    }
  };

  const handleClosePublish = () => {
    setShowPublishPopup(false);
  };

  const handleChoosePermission = (event) => {
    setPermissionPost(event.target.value);
  };

  const updateTitlePost = (event) => {
    setTitlePost(event.target.value);
  };

  const UpdateSummaryPost = (event) => {
    setSummaryPost(event.target.value);
  };

  const changeThumbnailTemp = async (e) => {
    const thumnail = e.target.files[0];
    if (thumnail) {
      const imageUrl = URL.createObjectURL(thumnail);
      setThumbnailPost(thumnail);
      setThumbnailTemp(imageUrl);
    }
  };

  const handleTimePost = () => {
    const currentDate = moment();
    var dateObj = currentDate.format("MMM Do YY");
    setCurrentTime(dateObj);
  };

  const convertImageUrlToFile = async (imageUrl, caption) => {
    try {
      const maxSize = 1 * 1024 * 1024;
      const response = await fetch(imageUrl);
      let blob = await response.blob();

      if (blob.size > maxSize) {
        blob = blob.slice(0, maxSize, blob.type);
      }

      const file = new File([blob], caption, { type: blob.type });
      setThumbnailPost(file);
    } catch (error) {
      console.error("Error converting image:", error);
    }
  };

  const updateNewCategory = (event) => {
    const newCategory = event.target.value;
    setNewCategory(newCategory);
  };

  const addNewCategory = (newCategory) => {
    if (categories.includes(newCategory)) {
    } else if (newCategory !== null) {
      const newCategories = categories.filter((category) => category !== "+");

      setCategories([...newCategories, newCategory, "+"]);
      handleSelectCategories(newCategory);
      setNewCategoriesList([...newCategoriesList, newCategory]);
    }
  };

  const getAllCategories = async () => {
    const apiUrl = `${apiDomain}/v1/api/post/categrories`;
    const response = await callGetApiWithoutToken(apiUrl);
    setCategories([...response.metaData.categories, "+"]);
  };

  const handleSelectCategories = (category) => {
    handleTimePost();
    if (selectedCategories.includes(category)) {
      setSelectedCategories(
        selectedCategories.filter((selectedTag) => selectedTag !== category)
      );
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  useEffect(() => {
    const contentPostJson = JSON.parse(contentPost);

    if (contentPostJson === null) return;
    // Update Title
    const title = contentPostJson?.title;
    setTitlePost(title ? title : "");
    const blocks = contentPostJson?.content?.blocks;

    // Update Summary
    const paragraph = blocks.find((element) => element.type === "paragraph");
    const text = paragraph?.data.text;
    setSummaryPost(text ? text : "");

    // Update Thumnail
    const images = blocks.find((element) => element.type === "image");
    const url = images?.data.file.url;
    const caption = images?.data.caption;
    convertImageUrlToFile(url, caption);
    setThumbnailTemp(url ? url : "/account-logo.png");
  }, [contentPost]);

  useEffect(() => {
    var avatar = useProfile?.AvatarUrl;
    var userName = useProfile?.userName;
    setAvatar(avatar);
    setUserName(userName);
  }, [useProfile]);

  useEffect(() => {
    getAllCategories();
  }, []);

  return (
    <div className="publish-container">
      <div className="publish-form">
        <div className="close-btn-component" onClick={handleClosePublish}>
          <i class="fas fa-times"></i>
        </div>
        <div className="form-component">
          <div className="review-component">
            <div className="story-review">
              <div className="title-text">Story Review</div>
            </div>
            <div className="author-review">
              <img
                src={avatar !== null ? avatar : "/account-logo.png"}
                alt=""
              ></img>
              <div className="title-text">
                {userName !== null ? userName : "Amonyus"}
              </div>
            </div>
            <div className="content-review">
              <div className="summary-review">
                <div className="title-post sub-title-text">{titlePost}</div>
                <div className="summary-post content-text">{summaryPost}</div>
              </div>
              <div className="thumnail-review">
                <img src={thumbnailTemp} alt=""></img>
              </div>
            </div>
            {selectedCategories.length !== 0 && (
              <div className="tag-review">
                <div className="tag-group">
                  {selectedCategories.length > 3 ? (
                    <Fragment>
                      {selectedCategories
                        .slice(MIN_CATEGORIES_SHOW, MAX_CATEGORIES_SHOW)
                        .map((category) => (
                          <div className="tag tag-text">{category}</div>
                        ))}
                      <div className="tag tag-text">...</div>
                    </Fragment>
                  ) : (
                    selectedCategories.map((category) => (
                      <div className="tag tag-text">{category}</div>
                    ))
                  )}
                </div>
                <div className="time tag-text">{currentTime}</div>
              </div>
            )}
          </div>
          <div className="input-component">
            <div className="author-input">
              <div className="content-text">Publishing to:</div>
              <div className="content-text">
                <b>{userName !== null ? userName : "Amonyus"}</b>
              </div>
            </div>
            <div className="permission-input">
              <div className="title content-text">
                Choose status of your Post:
              </div>
              <div className="select">
                <Box sx={{ minWidth: 120 }}>
                  <FormControl fullWidth>
                    <RadioGroup
                      row
                      aria-labelledby="demo-row-radio-buttons-group-label"
                      name="row-radio-buttons-group"
                      onChange={handleChoosePermission}
                      defaultValue="public"
                    >
                      <Tooltip title="Public" placement="top">
                        <FormControlLabel
                          value="public"
                          control={
                            <Radio
                              icon={<LanguageIcon />}
                              checkedIcon={<LanguageIcon />}
                            />
                          }
                        />
                      </Tooltip>
                      <Tooltip title="Private" placement="top">
                        <FormControlLabel
                          value="private"
                          control={
                            <Radio
                              icon={<LockOpenIcon />}
                              checkedIcon={<LockOpenIcon />}
                            />
                          }
                        />
                      </Tooltip>
                      <Tooltip title="Follower" placement="top">
                        <FormControlLabel
                          value="follower"
                          control={
                            <Radio
                              icon={<GroupIcon />}
                              checkedIcon={<GroupIcon />}
                            />
                          }
                        />
                      </Tooltip>
                    </RadioGroup>
                  </FormControl>
                </Box>
              </div>
            </div>
            {displayError.permission === true && (
              <div className="title content-text err">
                Please select permission for your post
              </div>
            )}
            <div className="title-input">
              <div className="title content-text">
                Add or change your title post
              </div>
              <div className="input">
                <textarea
                  placeholder="Your Title ..."
                  value={titlePost}
                  onChange={updateTitlePost}
                />
              </div>
            </div>
            {displayError.title === true && (
              <div className="title content-text err">
                Please add your title post
              </div>
            )}
            <div className="summary-input">
              <div className="title content-text">
                Add or change summary (about 100 words)
              </div>
              <div className="input">
                <textarea
                  placeholder="Your Summary ..."
                  value={summaryPost}
                  onChange={UpdateSummaryPost}
                />
              </div>
            </div>
            {displayError.summarize === true && (
              <div className="title content-text err">
                Please add your summary post
              </div>
            )}
            <div className="tag-input">
              <div className="title content-text">
                Choose topic of your post:
              </div>
              <div className="select">
                {categories.map((category) =>
                  category === "+" ? (
                    <Chip
                      key={category}
                      label={category}
                      clickable
                      onClick={() => setShowAddCategory(!showAddCategory)}
                      color={"success"}
                      style={{
                        margin: "10px",
                        padding: "10px 20px",
                        borderRadius: "20px",
                        fontSize: "20px",
                        fontWeight: "700",
                      }}
                    />
                  ) : (
                    <Chip
                      key={category}
                      label={"# " + category}
                      clickable
                      onClick={() => handleSelectCategories(category)}
                      color={
                        selectedCategories.includes(category)
                          ? "primary"
                          : "default"
                      }
                      style={{ margin: "5px", borderRadius: "10px" }}
                    />
                  )
                )}
                {showAddCategory === true && (
                  <div className="add-new">
                    <div className="input">
                      <input
                        type="text"
                        placeholder="Type Your Category"
                        onChange={updateNewCategory}
                      ></input>
                    </div>
                    <div
                      className="btn tag-text"
                      onClick={() => {
                        addNewCategory(newCategory);
                      }}
                    >
                      Add New
                    </div>
                  </div>
                )}
              </div>
            </div>
            {displayError.categories === true && (
              <div className="title content-text err">
                Please select your topic post
              </div>
            )}
            <div className="upload-file-input">
              <div className="title content-text">
                Update thumbnail for your post:
              </div>
              <div className="input">
                <input
                  type="file"
                  id="actual-btn"
                  hidden
                  onChange={changeThumbnailTemp}
                />
                <label className="upload-file-btn" for="actual-btn">
                  <i class="fas fa-cloud-upload-alt"></i>
                </label>
              </div>
            </div>
            <div className="submit-btn">
              <div className="btn content-text" onClick={onSubmit}>
                Publish now
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublishForm;
