// src/app/services/recipes/recipe.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RecipePayload {
  title: string;
  description?: string;
  ingredients: { name: string; quantity: string }[];
  steps: { description: string; step_number: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private apiUrl = 'http://127.0.0.1:8000/api/recipes';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  create(recipe: RecipePayload): Observable<any> {
    return this.http.post(this.apiUrl, recipe);
  }

  update(id: number, recipe: RecipePayload): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, recipe);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
