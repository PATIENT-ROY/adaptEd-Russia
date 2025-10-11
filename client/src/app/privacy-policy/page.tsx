"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Eye,
  Lock,
  Users,
  Database,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Политика обработки персональных данных
          </h1>
          <p className="text-xl text-gray-600">
            Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
          </p>
        </div>

        <div className="space-y-8">
          {/* Общие положения */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                1. Общие положения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Настоящая Политика обработки персональных данных (далее —
                Политика) определяет порядок обработки персональных данных
                пользователей платформы AdaptEd Russia (далее — Платформа, мы,
                наш).
              </p>
              <p className="text-gray-700">
                Используя нашу Платформу, вы соглашаетесь с условиями настоящей
                Политики и даете согласие на обработку ваших персональных данных
                в соответствии с Федеральным законом &ldquo;О персональных
                данных&rdquo; от 27.07.2006 N 152-ФЗ.
              </p>
            </CardContent>
          </Card>

          {/* Какие данные мы собираем */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                2. Какие персональные данные мы собираем
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    При регистрации:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Имя и фамилия</li>
                    <li>• Email адрес</li>
                    <li>• Страна проживания</li>
                    <li>• Университет и факультет</li>
                    <li>• Год обучения</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    При использовании:
                  </h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Напоминания и задачи</li>
                    <li>• Сообщения в чате</li>
                    <li>• Обращения в поддержку</li>
                    <li>• Предпочтения и настройки</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Цели обработки */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                3. Цели обработки персональных данных
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>
                    Предоставление доступа к образовательным материалам и гайдам
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Организация системы напоминаний и планирования</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Обеспечение работы AI-помощника и чата</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Обработка обращений в службу поддержки</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>
                    Улучшение качества сервиса и разработка новых функций
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Сроки хранения */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                4. Сроки хранения персональных данных
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-900 mb-2">
                    Активные пользователи:
                  </h4>
                  <p className="text-sm text-orange-800">
                    Данные хранятся в течение всего периода использования
                    Платформы
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">
                    Неактивные пользователи:
                  </h4>
                  <p className="text-sm text-red-800">
                    Данные удаляются через 3 года после последней активности
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Безопасность */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" />
                5. Меры по защите персональных данных
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Шифрование данных при передаче (HTTPS/SSL)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Хеширование паролей с использованием bcrypt</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Регулярное резервное копирование данных</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Ограниченный доступ к персональным данным</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Мониторинг и логирование доступа к данным</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Права пользователей */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                6. Ваши права
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>
                    Получать информацию об обработке ваших персональных данных
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>
                    Требовать уточнения, блокирования или уничтожения данных
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>
                    Отзывать согласие на обработку персональных данных
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>
                    Обращаться в уполномоченный орган по защите прав субъектов
                    персональных данных
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Контакты */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                7. Контактная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                По всем вопросам, связанным с обработкой персональных данных, вы
                можете обратиться к нам:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Email</p>
                    <p className="text-sm text-blue-800">
                      privacy@adapted-russia.ru
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Phone className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Телефон</p>
                    <p className="text-sm text-green-800">+7 (800) 555-0123</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Кнопка возврата */}
        <div className="text-center mt-12">
          <Link
            href="/support"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Shield className="h-4 w-4 mr-2" />
            Вернуться к форме поддержки
          </Link>
        </div>
      </div>
    </div>
  );
}
