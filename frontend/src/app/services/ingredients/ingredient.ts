import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IngredientService {
  private apiUrl = 'http://127.0.0.1:8000/api/ingredients';
  private username = 'mfs';
  private password = 'lzZ5ligBgA';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const basicAuth = btoa(`${this.username}:${this.password}`);
    return new HttpHeaders({
      'Authorization': `Basic ${basicAuth}`
    });
  }

  // GET all ingredients
  getAllIngredients(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  // GET ingredient by name
  getIngredientByName(name: string): Observable<any> {
    // const params = new HttpParams().set('ingredient', name);
    // return this.http.get(this.apiUrl, {
    //   headers: this.getAuthHeaders(),
    //   params
    // });
    return this.http.get(`${this.apiUrl}/search/${name}`);
  }

  // POST new ingredient
  addIngredient(data: {
    name: string;
    carbs: number;
    fat: number;
    protein: number;
  }): Observable<any> {
    const body = new URLSearchParams();
    body.set('name', data.name);
    body.set('carbs', data.carbs.toString());
    body.set('fat', data.fat.toString());
    body.set('protein', data.protein.toString());

    return this.http.post(`${this.apiUrl}`, body.toString(), {
      headers: this.getAuthHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
    });
  }
}
