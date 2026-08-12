"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, Shield, Mail } from "lucide-react";
import { formatDate, getCurrentDateISO } from "@/lib/date-utils";

export default function PersonalDataConsentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
            <FileCheck className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Согласие на обработку персональных данных
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Актуальная редакция: {formatDate(getCurrentDateISO())}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-indigo-600" />
                1. Оператор персональных данных
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                Оператором персональных данных является платформа{" "}
                <strong>AdaptEd Russia</strong> (далее — Оператор).
              </p>
              <p>
                Контакт для обращений по вопросам персональных данных:{" "}
                <a
                  href="mailto:privacy@adapted-russia.ru"
                  className="text-indigo-600 underline hover:text-indigo-700"
                >
                  privacy@adapted-russia.ru
                </a>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Предмет согласия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                Настоящим субъект персональных данных (далее — Пользователь)
                свободно, своей волей и в своём интересе даёт согласие Оператору
                на обработку персональных данных в соответствии с Федеральным
                законом от 27.07.2006 №&nbsp;152-ФЗ «О персональных данных».
              </p>
              <p>
                Согласие предоставляется при регистрации на платформе, отправке
                форм обратной связи, отзывов и иных действий, связанных с
                передачей персональных данных Оператору.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                3. Перечень персональных данных
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-700 leading-relaxed">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>фамилия, имя (при указании);</li>
                <li>адрес электронной почты;</li>
                <li>страна проживания / гражданства;</li>
                <li>сведения об университете, факультете, курсе (при указании);</li>
                <li>
                  содержание обращений в поддержку, отзывов и сообщений
                  сообщества;
                </li>
                <li>
                  технические данные, необходимые для работы сайта (cookie,
                  идентификаторы сессии, IP-адрес в объёме, требуемом для
                  безопасности и работоспособности сервиса).
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">4. Цели обработки</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-700 leading-relaxed">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>регистрация и идентификация пользователя;</li>
                <li>предоставление доступа к функциям платформы;</li>
                <li>обработка обращений и обратной связи;</li>
                <li>улучшение качества сервиса и поддержка пользователей;</li>
                <li>
                  исполнение требований законодательства Российской Федерации.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                5. Действия с персональными данными
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                Обработка включает: сбор, запись, систематизацию, накопление,
                хранение, уточнение (обновление, изменение), извлечение,
                использование, обезличивание, блокирование, удаление,
                уничтожение.
              </p>
              <p>
                Обработка осуществляется с использованием средств автоматизации
                и без использования таких средств.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">6. Срок действия согласия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                Согласие действует с момента его предоставления до момента
                отзыва либо до достижения целей обработки, если более ранний
                срок не следует из существа отношений.
              </p>
              <p>
                Пользователь вправе отозвать согласие, направив обращение на{" "}
                <a
                  href="mailto:privacy@adapted-russia.ru"
                  className="text-indigo-600 underline hover:text-indigo-700"
                >
                  privacy@adapted-russia.ru
                </a>
                . После отзыва Оператор прекращает обработку, за исключением
                случаев, когда обработка допускается без согласия на основании
                закона.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">7. Связанные документы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                Порядок обработки персональных данных также описан в{" "}
                <Link
                  href="/privacy-policy"
                  className="text-indigo-600 underline hover:text-indigo-700 font-medium"
                >
                  Политике обработки персональных данных
                </Link>
                .
              </p>
              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <Mail className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
                <p className="text-sm text-indigo-900">
                  Поставьте отметку о согласии только если вы ознакомились с
                  настоящим документом и Политикой. Галочка согласия на формах
                  сайта не устанавливается автоматически.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
