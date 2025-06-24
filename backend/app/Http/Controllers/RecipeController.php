<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Recipe;
use App\Models\Ingredient;

class RecipeController extends Controller
{
    // GET all recipes
    public function index()
    {
        return Recipe::with(['ingredients', 'steps'])->get();
    }

    // GET one recipe
    public function show($id)
    {
        $recipe = Recipe::with(['ingredients', 'steps'])->findOrFail($id);
        return response()->json($recipe);
    }

    // POST new recipe
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'ingredients' => 'required|array',
            'ingredients.*.name' => 'required|string',
            'ingredients.*.quantity' => 'required|string',
            'steps' => 'required|array',
            'steps.*.description' => 'required|string',
            'steps.*.step_number' => 'required|integer',
        ]);

        $recipe = Recipe::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null
        ]);

        // Attach ingredients to the recipe
        foreach ($data['ingredients'] as $ingredientData) {
            $ingredient = Ingredient::firstOrCreate(['name' => $ingredientData['name']]);
            $recipe->ingredients()->attach($ingredient->id, ['quantity' => $ingredientData['quantity']]);
        }

        // Create steps
        foreach ($data['steps'] as $step) {
            $recipe->steps()->create($step);
        }

        return response()->json($recipe->load('ingredients', 'steps'), 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'ingredients' => 'required|array',
            'ingredients.*.name' => 'required|string',
            'ingredients.*.quantity' => 'required|string',
            'steps' => 'required|array',
            'steps.*.description' => 'required|string',
            'steps.*.step_number' => 'required|integer',
        ]);

        $recipe = Recipe::findOrFail($id);
        $recipe->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? null
        ]);

        // Sync ingredients
        $ingredientIds = [];
        foreach ($data['ingredients'] as $ingredientData) {
            $ingredient = Ingredient::firstOrCreate(['name' => $ingredientData['name']]);
            $ingredientIds[$ingredient->id] = ['quantity' => $ingredientData['quantity']];
        }
        $recipe->ingredients()->sync($ingredientIds);

        // Replace steps
        $recipe->steps()->delete();
        foreach ($data['steps'] as $step) {
            $recipe->steps()->create($step);
        }

        return response()->json($recipe->load('ingredients', 'steps'));
    }


    // DELETE a recipe
    public function destroy($id)
    {
        $recipe = Recipe::findOrFail($id);
        $recipe->delete();

        return response()->json(['message' => 'Recipe deleted']);
    }
}
