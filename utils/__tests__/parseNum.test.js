import parseNum from '../parseNum';

describe('parseNum', () => {
  it('понимает точку и запятую', () => {
    expect(parseNum('1.5')).toBe(1.5);
    expect(parseNum('1,5')).toBe(1.5);
    expect(parseNum(' 40 ')).toBe(40);
  });

  it('принимает разделитель на конце и в начале, пока дробь набирается', () => {
    expect(parseNum('5.')).toBe(5);
    expect(parseNum('70,')).toBe(70);
    expect(parseNum('.5')).toBe(0.5);
  });

  it('отклоняет пустой и некорректный ввод', () => {
    for (const bad of ['', '   ', 'abc', '1,5.0', '1.2.3', '+', '.', null, undefined]) {
      expect(parseNum(bad)).toBeUndefined();
    }
  });

  it('пропускает ноль и отрицательные числа — их отсекают калькуляторы', () => {
    expect(parseNum('0')).toBe(0);
    expect(parseNum('-3')).toBe(-3);
  });
});
