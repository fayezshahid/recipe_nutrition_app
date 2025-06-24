<?php

use App\Http\Controllers\RecipeController;
use App\Http\Controllers\IngredientController;
use Illuminate\Support\Facades\Route;

Route::prefix('recipes')->group(function () {
    Route::get('/', [RecipeController::class, 'index']);     // GET all recipes
    Route::post('/', [RecipeController::class, 'store']);    // POST new recipe
    Route::get('/{id}', [RecipeController::class, 'show']);  // GET single recipe
    Route::delete('/{id}', [RecipeController::class, 'destroy']); // DELETE recipe
    Route::put('/{id}', [RecipeController::class, 'update']); // PUT update recipe
});

Route::prefix('ingredients')->group(function () {
    Route::get('/', [IngredientController::class, 'index']);            // GET all ingredients
    Route::post('/', [IngredientController::class, 'store']);           // POST new ingredient
    Route::get('/search/{name}', [IngredientController::class, 'search']); // GET ingredient by name
});


