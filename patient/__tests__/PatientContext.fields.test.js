// Поля пациента: неверно набранное число не оставляет в расчёте прежнее значение (аудит DocHub M1-20),
// поле получает текст ошибки; набор «5,» ошибкой не считается.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import {
  INVALID_NUMBER,
  PatientProvider,
  usePatient,
  usePatientAge,
  usePatientNumber,
} from '../PatientContext';

let hooks;
function Spy() {
  hooks = {
    ctx: usePatient(),
    weight: usePatientNumber('weightKg'),
    age: usePatientAge(),
  };
  return null;
}

const mount = (initialPatient) => {
  act(() => {
    renderer.create(
      <PatientProvider initialPatient={initialPatient}>
        <Spy />
      </PatientProvider>,
    );
  });
};

describe('usePatientNumber', () => {
  test('верное число пишется в пациента, ошибки нет', () => {
    mount();
    act(() => hooks.weight.onChangeText('3,2'));
    expect(hooks.ctx.patient.weightKg).toBe(3.2);
    expect(hooks.weight.error).toBeNull();
  });

  test('набор «5,» — не ошибка', () => {
    mount();
    act(() => hooks.weight.onChangeText('5,'));
    expect(hooks.ctx.patient.weightKg).toBe(5);
    expect(hooks.weight.error).toBeNull();
  });

  test('«3.2.5» — ошибка, прежнее 3,2 в расчёт не идёт, строка в поле остаётся', () => {
    mount();
    act(() => hooks.weight.onChangeText('3.2'));
    act(() => hooks.weight.onChangeText('3.2.5'));
    expect(hooks.ctx.patient.weightKg).toBeNull();
    expect(hooks.weight.text).toBe('3.2.5');
    expect(hooks.weight.error).toBe(INVALID_NUMBER);
  });

  test('отрицательное число — ошибка', () => {
    mount();
    act(() => hooks.weight.onChangeText('-5'));
    expect(hooks.ctx.patient.weightKg).toBeNull();
    expect(hooks.weight.error).toBe(INVALID_NUMBER);
  });

  test('пустое поле — без ошибки', () => {
    mount({ weightKg: 10 });
    act(() => hooks.weight.onChangeText(''));
    expect(hooks.ctx.patient.weightKg).toBeNull();
    expect(hooks.weight.error).toBeNull();
  });
});

describe('usePatientAge', () => {
  test('неверное число лет — ошибка у поля «лет», возраст в пациенте не меняется', () => {
    mount();
    act(() => hooks.age.years.onChangeText('5'));
    expect(hooks.ctx.patient.ageMonths).toBe(60);
    act(() => hooks.age.years.onChangeText('5..'));
    // экран сам не берёт возраст в расчёт при ошибке (группа «ребёнок» не пропадает посреди набора)
    expect(hooks.ctx.patient.ageMonths).toBe(60);
    expect(hooks.age.years.error).toBe(INVALID_NUMBER);
    expect(hooks.age.months.error).toBeNull();
    expect(hooks.age.years.text).toBe('5..');
  });

  test('исправленный ввод снова даёт возраст', () => {
    mount();
    act(() => hooks.age.years.onChangeText('abc'));
    act(() => hooks.age.years.onChangeText('2'));
    act(() => hooks.age.months.onChangeText('3'));
    expect(hooks.ctx.patient.ageMonths).toBe(27);
    expect(hooks.age.years.error).toBeNull();
  });
});
