import { useState, useEffect, startTransition } from "react";
import FirebaseAuthService from "./FirebaseAuthService";
import "./App.css";
import LoginForm from "./components/LoginForm";
import AddEditRecipeForm from "./components/AddEditRecipeForm";
import FirebaseFirestoreService from "./FirebaseFirestoreService";

function App() {
  const [user, setUser] = useState(null);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [orderBy, setOrderBy] = useState("publishDateDesc");
  const [recipesPerPage, setRecipesPerPage] = useState(3);

  useEffect(() => {
    setIsLoading(true);
    fetchRecipes()
      .then((fetchedRecipes) => {
        setRecipes(fetchedRecipes);
      })
      .catch((error) => {
        console.error(error.message);
        throw error;
      })
      .finally(() => {
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, categoryFilter, orderBy, recipesPerPage]);

  FirebaseAuthService.subscribeToAuthChanges(setUser);

  const fetchRecipes = async (cursorId = "") => {
    const queries = [];
    if (categoryFilter) {
      queries.push({
        field: "category",
        condition: "==",
        value: categoryFilter,
      });
    }
    if (!user) {
      queries.push({
        field: "isPublished",
        condition: "==",
        value: true,
      });
    }
    const orderByField = "publishDate";
    let orderByDirection;
    if (orderBy) {
      switch (orderBy) {
        case "publishDateAsc":
          orderByDirection = "asc";
          break;
        case "publishDateDesc":
          orderByDirection = "desc";
          break;
        default:
          break;
      }
    }
    let fetchedRecipes = [];
    try {
      const response = await FirebaseFirestoreService.readDocuments({
        collection: "recipes",
        queries: queries,
        orderByField: orderByField,
        orderByDirection: orderByDirection,
        perPage: recipesPerPage,
        cursorId: cursorId,
      });
      const newRecipes = response.docs.map((recipeDoc) => {
        const id = recipeDoc.id;
        const data = recipeDoc.data();
        data.publishDate = new Date(data.publishDate.seconds * 1000);

        return { ...data, id };
      });
      if (cursorId) {
        fetchedRecipes = [...recipes, ...newRecipes];
      } else {
        fetchedRecipes = [...newRecipes];
      }
    } catch (error) {
      console.error(error.message);
      throw error;
    }
    return fetchedRecipes;
  };

  const handleRecipesPerPageChange = (e) => {
    const recipesPerPage = e.target.value;
    startTransition(() => {
      setRecipes("");
      setRecipesPerPage(recipesPerPage);
    });
  };

  const handleLoadMoreRecipesClick = () => {
    const lastRecipe = recipes[recipes.length - 1];
    const cursorId = lastRecipe.id;
    handleFetchRecipes(cursorId);
  };

  const handleFetchRecipes = async (cursorId = "") => {
    try {
      const fetchedRecipes = await fetchRecipes(cursorId);
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  };

  const handleAddRecipe = async (newRecipe) => {
    try {
      const res = await FirebaseFirestoreService.createDocument(
        "recipes",
        newRecipe
      );

      handleFetchRecipes();

      alert(`succesfully created a recipe with an ID of ${res.id}`);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdateRecipe = async (newRecipe, recipeId) => {
    try {
      await FirebaseFirestoreService.updateDocument(
        "recipes",
        recipeId,
        newRecipe
      );
      handleFetchRecipes();
      alert(`successfully updated a recipe with ID = ${recipeId}`);
      startTransition(() => {
        setCurrentRecipe(null);
      });
    } catch (error) {
      alert(error.message);
      throw error;
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    const deleteConfirmation = window.confirm(
      "Are you sure you want to delete this recipe?"
    );
    if (deleteConfirmation) {
      try {
        await FirebaseFirestoreService.deleteDocument("recipes", recipeId);
        handleFetchRecipes();
        startTransition(() => {
          setCurrentRecipe(null);
        });
        window.scrollTo(0, 0);
        alert(`successfully deleted a recipe with ID = ${recipeId}`);
      } catch (error) {
        alert(error.message);
        throw error;
      }
    }
  };

  const handleEditRecipeClick = (recipeID) => {
    const selectedRecipe = recipes.find((recipe) => {
      return recipe.id === recipeID;
    });
    if (selectedRecipe) {
      startTransition(() => {
        setCurrentRecipe(selectedRecipe);
      });
      window.scrollTo(0, document.body.scrollHeight);
    }
  };

  const handleEditRecipeCancel = () => {
    startTransition(() => {
      setCurrentRecipe(null);
    });
  };

  const lookupCategoryLabel = (categoryKey) => {
    const categories = {
      breadsSandwichesAndPizza: "Breads, Sandwiches, and Pizza",
      eggsAndBreakfast: "Eggs & Breakfast",
      dessertsAndBakedGoods: "Desserts and Baked Goods",
      fishAndSeafood: "Fish and Seafood",
      vegetables: "Vegetables",
    };
    const label = categories[categoryKey];
    return label;
  };

  const formatDate = (date) => {
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getFullYear();

    const dateString = `${month}-${day}-${year}`;
    return dateString;
  };

  return (
    <div className="App">
      <div className="title-row">
        <h1 className="title">Recipes App</h1>
        <LoginForm existingUser={user} />
      </div>
      <div className="main">
        <div className="row filters">
          <label htmlFor="" className="recipe-label input-label">
            Category:
            <select
              value={categoryFilter}
              onChange={(e) => {
                startTransition(() => {
                  setCategoryFilter(e.target.value);
                });
              }}
              className="select"
              required
            >
              <option value=""></option>
              <option value="breadsSandwichesAndPizza">
                Breads, Sandwiches, and Pizza
              </option>
              <option value="eggsAndBreakfast">Eggs & Breakfast</option>
              <option value="dessertsAndBakedGoods">
                Desserts and Baked Goods
              </option>
              <option value="fishAndSeafood">Fish and Seafood</option>
              <option value="vegetables">Vegetables</option>
            </select>
          </label>
          <label className="input-label">
            Sort By:
            <select
              value={orderBy}
              onChange={(e) =>
                startTransition(() => {
                  setOrderBy(e.target.value);
                })
              }
              className="select"
            >
              <option value="publishDateAsc">Ascending</option>
              <option value="publishDateDesc">Descending</option>
            </select>
          </label>
        </div>
        <div className="center">
          <div className="recipe-list-box">
            {isLoading && (
              <div className="fire">
                <div className="flames">
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                </div>
                <div className="logs"></div>
              </div>
            )}
            {!isLoading && recipes && recipes.length === 0 && (
              <h5 className="no-recipes">No Recipes Found</h5>
            )}
            {!isLoading && recipes && recipes.length > 0 ? (
              <div className="recipe-list">
                {recipes.map((recipe) => {
                  return (
                    <div className="recipe-card" key={recipe.key}>
                      {!recipe.isPublished && (
                        <div className="unpublished">UNPUBLISHED</div>
                      )}
                      <div className="recipe-name">{recipe.name}</div>
                      <div className="recipe-field">
                        Category: {lookupCategoryLabel(recipe.category)}
                      </div>
                      <div className="recipe-field">
                        Publish Date: {formatDate(recipe.publishDate)}
                      </div>
                      {user && (
                        <button
                          className="primary-button edit-button"
                          type="button"
                          onClick={() => handleEditRecipeClick(recipe.id)}
                        >
                          EDIT
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
        {isLoading ||
          (recipes && recipes.length > 0 && (
            <>
              <label className="input-label">
                Recipes Per Page:
                <select
                  value={recipesPerPage}
                  onChange={handleRecipesPerPageChange}
                  className="select"
                >
                  <option value="3">3</option>
                  <option value="6">6</option>
                  <option value="9">9</option>
                </select>
              </label>
              <div className="pagination">
                <button
                  type="button"
                  onClick={handleLoadMoreRecipesClick}
                  className="primary-button"
                >
                  Load More Recipes
                </button>
              </div>
            </>
          ))}
        {user && (
          <AddEditRecipeForm
            handleAddRecipe={handleAddRecipe}
            handleUpdateRecipe={handleUpdateRecipe}
            existingRecipe={currentRecipe}
            handleEditRecipeCancel={handleEditRecipeCancel}
            handleDeleteRecipe={handleDeleteRecipe}
          />
        )}
      </div>
    </div>
  );
}

export default App;
