import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResponse } from '../models/api';
import { CategoryDto, CategoryListQuery, SaveCategoryRequest } from '../models/category';
import { buildParams } from './products-service';

// CRUD de categorías de producto contra /api/categories.
@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/categories`;

  getCategories(query: CategoryListQuery = {}): Observable<PagedResponse<CategoryDto>> {
    return this.http.get<PagedResponse<CategoryDto>>(this.baseUrl, {
      params: buildParams(query),
    });
  }

  createCategory(body: SaveCategoryRequest): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.baseUrl, body);
  }
}
